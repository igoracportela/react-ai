import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { createReadStream, existsSync } from 'fs';
import { AiErrorCode, AiProcessingError } from './ai.errors';

const SOAP_SYSTEM_PROMPT = `You are a clinical documentation assistant for home healthcare.
Given raw clinical note text (from transcription or typed input), structure it in SOAP format.
Respond with valid JSON only, using these keys:
- chiefComplaint
- historyPresentIllness
- physicalExamination
- assessment
- plan
Use empty string for sections with no relevant information.`;

export interface SoapStructure {
  chiefComplaint?: string;
  historyPresentIllness?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI | null;
  private readonly mockMode: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.mockMode = !apiKey || process.env.AI_MOCK_MODE === 'true';
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;

    if (this.mockMode) {
      this.logger.warn(
        'Running in AI mock mode (set OPENAI_API_KEY for real transcription/summarization)',
      );
    }
  }

  async transcribeAudio(filePath: string): Promise<string> {
    if (!existsSync(filePath)) {
      throw new AiProcessingError(
        'Audio file is missing on the server. The upload may have failed.',
        AiErrorCode.TRANSCRIPTION_FAILED,
      );
    }

    if (this.mockMode) {
      return (
        'Patient reports increased shortness of breath over the past three days. ' +
        'Denies chest pain. Oxygen saturation 94% on room air. Mild bilateral ankle edema noted. ' +
        'Continue current diuretic regimen and schedule follow-up in one week.'
      );
    }

    try {
      const transcription = await this.openai!.audio.transcriptions.create({
        file: createReadStream(filePath),
        model: process.env.WHISPER_MODEL ?? 'whisper-1',
        language: 'en',
      });

      const text = transcription.text?.trim();
      if (!text) {
        throw new AiProcessingError(
          'Transcription returned no text. The recording may be silent or unintelligible.',
          AiErrorCode.TRANSCRIPTION_FAILED,
        );
      }

      return text;
    } catch (error) {
      if (error instanceof AiProcessingError) throw error;

      this.logger.error('Whisper transcription failed', error);
      throw new AiProcessingError(
        'Audio transcription failed. The recording may be corrupted, too noisy, or the transcription service may be unavailable.',
        AiErrorCode.TRANSCRIPTION_FAILED,
        error,
      );
    }
  }

  async structureAsSoap(rawText: string): Promise<string> {
    if (!rawText.trim()) {
      throw new AiProcessingError(
        'Cannot structure an empty clinical note.',
        AiErrorCode.STRUCTURING_FAILED,
      );
    }

    const soap = this.mockMode
      ? this.mockSoap(rawText)
      : await this.fetchSoapFromModel(rawText);

    return this.formatSoapNote(soap);
  }

  private async fetchSoapFromModel(rawText: string): Promise<SoapStructure> {
    try {
      const completion = await this.openai!.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SOAP_SYSTEM_PROMPT },
          { role: 'user', content: rawText },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AiProcessingError(
          'AI summarization returned an empty response.',
          AiErrorCode.INVALID_RESPONSE,
        );
      }

      let parsed: SoapStructure;
      try {
        parsed = JSON.parse(content) as SoapStructure;
      } catch {
        throw new AiProcessingError(
          'AI summarization returned invalid structured data.',
          AiErrorCode.INVALID_RESPONSE,
        );
      }

      return {
        chiefComplaint: parsed.chiefComplaint ?? '',
        historyPresentIllness: parsed.historyPresentIllness ?? '',
        physicalExamination: parsed.physicalExamination ?? '',
        assessment: parsed.assessment ?? '',
        plan: parsed.plan ?? '',
      };
    } catch (error) {
      if (error instanceof AiProcessingError) throw error;

      this.logger.error('SOAP structuring failed', error);
      throw new AiProcessingError(
        'Clinical note structuring failed. The AI service may be unavailable — please retry shortly.',
        AiErrorCode.STRUCTURING_FAILED,
        error,
      );
    }
  }

  private mockSoap(rawText: string): SoapStructure {
    const preview = rawText.slice(0, 120);
    return {
      chiefComplaint: preview,
      historyPresentIllness: rawText,
      physicalExamination: 'See raw transcription for details.',
      assessment: 'Clinical assessment pending physician review.',
      plan: 'Follow up per home health care plan.',
    };
  }

  formatSoapNote(soap: SoapStructure): string {
    const sections = [
      ['Chief Complaint', soap.chiefComplaint],
      ['History of Present Illness', soap.historyPresentIllness],
      ['Physical Examination', soap.physicalExamination],
      ['Assessment', soap.assessment],
      ['Plan', soap.plan],
    ];

    return sections
      .filter(([, value]) => value?.trim())
      .map(([label, value]) => `${label}:\n${value}`)
      .join('\n\n');
  }
}
