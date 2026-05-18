import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1737129600000 implements MigrationInterface {
  name = 'InitialSchema1737129600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "note_status_enum" AS ENUM ('pending', 'processing', 'done', 'error')
    `);

    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "external_id" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "date_of_birth" date NOT NULL,
        "gender" character varying(20),
        "address" text,
        "phone_number" character varying(30),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patients" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "status" "note_status_enum" NOT NULL DEFAULT 'pending',
        "input_type" character varying(20) NOT NULL,
        "raw_transcription" text,
        "processed_note" text,
        "audio_path" character varying(500),
        "error_code" character varying(64),
        "error_message" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notes_patient" FOREIGN KEY ("patient_id")
          REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notes_patient_created" ON "notes" ("patient_id", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notes_status" ON "notes" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_notes_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notes_patient_created"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TABLE "patients"`);
    await queryRunner.query(`DROP TYPE "note_status_enum"`);
  }
}
