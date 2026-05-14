--
-- PostgreSQL database dump
--

\restrict tZznq0IAuhukFSz6SfCdrz6sLKpHjDmeaSF6JEDIonVgnwchsAcevFcAFQ8y9NT

-- Dumped from database version 13.23
-- Dumped by pg_dump version 13.23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100)
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    id character varying(50) NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now(),
    user_id character varying(50),
    user_name character varying(100),
    action character varying(200),
    details text
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materials (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    cat character varying(100),
    unit character varying(20),
    qty numeric(20,3) DEFAULT 0,
    cost numeric(20,2) DEFAULT 0,
    low integer DEFAULT 5,
    note text DEFAULT ''::text
);


ALTER TABLE public.materials OWNER TO postgres;

--
-- Name: project_material_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_material_usage (
    project_id text NOT NULL,
    material_id text NOT NULL,
    used_qty numeric
);


ALTER TABLE public.project_material_usage OWNER TO postgres;

--
-- Name: project_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_schedules (
    project_id text NOT NULL,
    data jsonb
);


ALTER TABLE public.project_schedules OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    budget numeric(20,2) DEFAULT 0,
    spent numeric(20,2) DEFAULT 0
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: structure_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.structure_materials (
    structure_id text NOT NULL,
    material_id text NOT NULL,
    material_name text,
    unit text,
    quantity numeric DEFAULT 1,
    id integer NOT NULL
);


ALTER TABLE public.structure_materials OWNER TO postgres;

--
-- Name: structure_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.structure_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.structure_materials_id_seq OWNER TO postgres;

--
-- Name: structure_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.structure_materials_id_seq OWNED BY public.structure_materials.id;


--
-- Name: structure_warehouse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.structure_warehouse (
    material_id text NOT NULL,
    material_name text,
    unit text DEFAULT ''::text,
    qty numeric DEFAULT 0,
    cost numeric DEFAULT 0,
    note text DEFAULT ''::text
);


ALTER TABLE public.structure_warehouse OWNER TO postgres;

--
-- Name: structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.structures (
    id text NOT NULL,
    name text NOT NULL,
    unit text DEFAULT 'cái'::text,
    qty numeric DEFAULT 0,
    cost numeric DEFAULT 0,
    note text DEFAULT ''::text
);


ALTER TABLE public.structures OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    phone character varying(20),
    email character varying(100),
    address text
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: sw_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sw_logs (
    id integer NOT NULL,
    material_id text,
    material_name text,
    qty numeric,
    unit text,
    cost numeric,
    note text,
    attachment text DEFAULT '[]'::text,
    created_at timestamp without time zone DEFAULT now(),
    type character varying(50) DEFAULT 'transfer'::character varying
);


ALTER TABLE public.sw_logs OWNER TO postgres;

--
-- Name: sw_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sw_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sw_logs_id_seq OWNER TO postgres;

--
-- Name: sw_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sw_logs_id_seq OWNED BY public.sw_logs.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id character varying(50) NOT NULL,
    mid character varying(50),
    supplier_id character varying(50),
    project_id character varying(50),
    date date,
    datetime timestamp without time zone,
    type character varying(20),
    qty numeric(20,3),
    unit_price numeric(20,2),
    vat_rate numeric(5,1),
    subtotal numeric(20,2),
    vat_amount numeric(20,2),
    total_amount numeric(20,2),
    note text,
    attachment text,
    invoice_image text
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id integer NOT NULL,
    name character varying(20)
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.units_id_seq OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users_table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_table (
    id character varying(50) NOT NULL,
    name character varying(100),
    username character varying(50),
    password character varying(200),
    role character varying(10),
    permissions jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.users_table OWNER TO postgres;

--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: structure_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structure_materials ALTER COLUMN id SET DEFAULT nextval('public.structure_materials_id_seq'::regclass);


--
-- Name: sw_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sw_logs ALTER COLUMN id SET DEFAULT nextval('public.sw_logs_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: project_material_usage project_material_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_material_usage
    ADD CONSTRAINT project_material_usage_pkey PRIMARY KEY (project_id, material_id);


--
-- Name: project_schedules project_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_schedules
    ADD CONSTRAINT project_schedules_pkey PRIMARY KEY (project_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: structure_materials structure_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structure_materials
    ADD CONSTRAINT structure_materials_pkey PRIMARY KEY (id);


--
-- Name: structure_warehouse structure_warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structure_warehouse
    ADD CONSTRAINT structure_warehouse_pkey PRIMARY KEY (material_id);


--
-- Name: structures structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: sw_logs sw_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sw_logs
    ADD CONSTRAINT sw_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: units units_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_name_key UNIQUE (name);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users_table users_table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_table
    ADD CONSTRAINT users_table_pkey PRIMARY KEY (id);


--
-- Name: users_table users_table_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_table
    ADD CONSTRAINT users_table_username_key UNIQUE (username);


--
-- Name: idx_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_action ON public.logs USING btree (action);


--
-- Name: idx_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_timestamp ON public.logs USING btree ("timestamp" DESC);


--
-- Name: idx_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_user_id ON public.logs USING btree (user_id);


--
-- Name: idx_materials_cat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materials_cat ON public.materials USING btree (cat);


--
-- Name: idx_materials_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materials_name ON public.materials USING btree (name);


--
-- Name: idx_materials_qty_low; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materials_qty_low ON public.materials USING btree (qty, low);


--
-- Name: idx_pmu_material_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pmu_material_id ON public.project_material_usage USING btree (material_id);


--
-- Name: idx_pmu_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pmu_project_id ON public.project_material_usage USING btree (project_id);


--
-- Name: idx_projects_budget; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_budget ON public.projects USING btree (budget);


--
-- Name: idx_projects_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_name ON public.projects USING btree (name);


--
-- Name: idx_ps_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ps_project_id ON public.project_schedules USING btree (project_id);


--
-- Name: idx_structure_materials_structure_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_structure_materials_structure_id ON public.structure_materials USING btree (structure_id);


--
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);


--
-- Name: idx_suppliers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_phone ON public.suppliers USING btree (phone);


--
-- Name: idx_sw_material_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sw_material_id ON public.structure_warehouse USING btree (material_id);


--
-- Name: idx_transactions_datetime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_datetime ON public.transactions USING btree (datetime);


--
-- Name: idx_transactions_mid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_mid ON public.transactions USING btree (mid);


--
-- Name: idx_transactions_mid_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_mid_type ON public.transactions USING btree (mid, type);


--
-- Name: idx_transactions_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_project_id ON public.transactions USING btree (project_id);


--
-- Name: idx_transactions_supplier_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_supplier_id ON public.transactions USING btree (supplier_id);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: idx_transactions_type_datetime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_type_datetime ON public.transactions USING btree (type, datetime);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users_table USING btree (username);


--
-- Name: structure_materials structure_materials_structure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structure_materials
    ADD CONSTRAINT structure_materials_structure_id_fkey FOREIGN KEY (structure_id) REFERENCES public.structures(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tZznq0IAuhukFSz6SfCdrz6sLKpHjDmeaSF6JEDIonVgnwchsAcevFcAFQ8y9NT

