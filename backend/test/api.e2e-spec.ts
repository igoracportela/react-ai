/**
 * HTTP integration tests — run against a live stack:
 *   docker compose up -d
 *   E2E_BASE_URL=http://localhost:3001/api npm run test:e2e
 */
const baseUrl = process.env.E2E_BASE_URL;

const describeE2e = baseUrl ? describe : describe.skip;

describeE2e('API (live stack)', () => {
  let patientId: string;

  beforeAll(async () => {
    const res = await fetch(`${baseUrl}/patients`);
    expect(res.ok).toBe(true);
    const patients = (await res.json()) as { id: string; name: string }[];
    expect(patients.length).toBeGreaterThanOrEqual(2);
    patientId = patients[0].id;
  });

  it('GET /patients returns seeded patients with demographics', async () => {
    const res = await fetch(`${baseUrl}/patients`);
    const patients = (await res.json()) as {
      name: string;
      externalId: string;
      dateOfBirth: string;
    }[];
    expect(patients[0].name).toBeTruthy();
    expect(patients[0].externalId).toMatch(/^MRN-/);
    expect(patients[0].dateOfBirth).toBeTruthy();
  });

  it('POST /notes (text) → done with rawTranscription and processedNote', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        text: 'Patient reports mild dyspnea on exertion. Lungs clear. Plan: follow up in one week.',
      }),
    });
    expect(res.status).toBe(201);
    const note = (await res.json()) as {
      status: string;
      rawTranscription: string;
      processedNote: string;
      patient: { name: string };
    };
    expect(note.status).toBe('done');
    expect(note.rawTranscription).toContain('dyspnea');
    expect(note.processedNote).toContain('Chief Complaint');
    expect(note.patient.name).toBeTruthy();
  });

  it('GET /notes lists patientName, createdAt, preview', async () => {
    const res = await fetch(`${baseUrl}/notes`);
    const notes = (await res.json()) as {
      patientName: string;
      createdAt: string;
      preview: string;
    }[];
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0].patientName).toBeTruthy();
    expect(notes[0].createdAt).toBeTruthy();
    expect(notes[0].preview).toBeTruthy();
  });
});
