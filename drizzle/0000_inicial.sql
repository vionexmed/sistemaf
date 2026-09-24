CREATE TABLE "atendimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"atleta_id" integer NOT NULL,
	"data" date NOT NULL,
	"periodo" text NOT NULL,
	"hd" text NOT NULL,
	"local" text NOT NULL,
	"objetivo" text NOT NULL,
	"status" text NOT NULL,
	"evolucao" text,
	"registrado_por" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atletas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"apelido" text NOT NULL,
	"camisa" integer NOT NULL,
	"posicao" text NOT NULL,
	"nascimento" date NOT NULL,
	"altura_cm" integer,
	"peso_kg" numeric(5, 1),
	"pe" text,
	"foto" text,
	"alergias" text,
	"lesoes_anteriores" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"atleta_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"caminho" text NOT NULL,
	"mime" text NOT NULL,
	"tamanho" integer NOT NULL,
	"enviado_por" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"atleta_id" integer NOT NULL,
	"dia" date NOT NULL,
	"tipo" text NOT NULL,
	"estrutura" text,
	"regiao" text NOT NULL,
	"lado" text NOT NULL,
	"reincidencia" boolean DEFAULT false NOT NULL,
	"dias_afastamento" integer,
	"campeonato" text NOT NULL,
	"periodo" text NOT NULL,
	"observacao" text,
	"registrado_por" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testes" (
	"id" serial PRIMARY KEY NOT NULL,
	"atleta_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"data" date NOT NULL,
	"dados" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"perfil" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_atleta_id_atletas_id_fk" FOREIGN KEY ("atleta_id") REFERENCES "public"."atletas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_registrado_por_usuarios_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_atleta_id_atletas_id_fk" FOREIGN KEY ("atleta_id") REFERENCES "public"."atletas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_enviado_por_usuarios_id_fk" FOREIGN KEY ("enviado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesoes" ADD CONSTRAINT "lesoes_atleta_id_atletas_id_fk" FOREIGN KEY ("atleta_id") REFERENCES "public"."atletas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesoes" ADD CONSTRAINT "lesoes_registrado_por_usuarios_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testes" ADD CONSTRAINT "testes_atleta_id_atletas_id_fk" FOREIGN KEY ("atleta_id") REFERENCES "public"."atletas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_unico" ON "atendimentos" USING btree ("atleta_id","data","periodo");--> statement-breakpoint
CREATE INDEX "atendimento_data" ON "atendimentos" USING btree ("data");--> statement-breakpoint
CREATE INDEX "lesao_atleta" ON "lesoes" USING btree ("atleta_id");