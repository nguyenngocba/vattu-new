--
-- PostgreSQL database dump
--

\restrict n7t5lxiClPrPubsdaT4XFkQ4zzLEOuVVQ1KKFL17qqW9NZsbaa6ltqdpNHEP3qr

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
    note text DEFAULT ''::text,
    CONSTRAINT materials_qty_nonnegative CHECK ((qty >= (0)::numeric))
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
    note text DEFAULT ''::text,
    CONSTRAINT structure_warehouse_qty_nonnegative CHECK ((qty >= (0)::numeric))
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
    note text DEFAULT ''::text,
    type text,
    zone text,
    position_x integer,
    position_y integer,
    layer integer DEFAULT 1,
    rotation numeric DEFAULT 0,
    length numeric DEFAULT 6,
    width numeric DEFAULT 1.2,
    height numeric DEFAULT 0.8,
    weight numeric DEFAULT 1200,
    project_id text,
    CONSTRAINT structures_qty_nonnegative CHECK ((qty >= (0)::numeric))
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
    invoice_image text,
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['purchase'::character varying, 'usage'::character varying, 'return'::character varying, 'produce'::character varying, 'structure_export'::character varying, 'structure_return'::character varying, 'transfer_sw'::character varying, 'return_from_sw'::character varying])::text[])))
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
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name) FROM stdin;
129	Bu lông - Ốc vít
130	Ống thép
131	Sơn - Chống gỉ
132	Thép hình
133	Thép hộp
134	Thép tấm
135	Vật tư hàn cắt
136	Vật tư phụ
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (id, "timestamp", user_id, user_name, action, details) FROM stdin;
LOG-DEMO-SEED	2026-05-16 20:54:30.090269	system	System	Reset dữ liệu mẫu	Seed dữ liệu sạch từ 2023 đến 16/05/2026
LOG2605162056001	2026-05-16 20:56:15.065397	u1	Admin	Đăng nhập	OK
LOG2605162105001	2026-05-16 21:05:19.116386	u1	Admin	Đăng nhập	OK
LOG2605171131001	2026-05-17 11:31:06.117245	u1	Admin	Đăng nhập	OK
LOG2605171205001	2026-05-17 12:05:14.265218	u1	Admin	Đăng nhập	OK
LOG2605171208001	2026-05-17 12:08:01.43674	u1	Admin	Đăng nhập	OK
LOG2605171213001	2026-05-17 12:14:00.077563	u1	Admin	Đăng nhập	OK
LOG2605171228001	2026-05-17 12:28:42.647289	u1	Admin	Đăng nhập	OK
LOG2605171230001	2026-05-17 12:30:32.9011	u1	Admin	Đăng nhập	OK
LOG2605171239001	2026-05-17 12:39:44.850353	u1	Admin	Đăng nhập	OK
LOG2605171255001	2026-05-17 12:55:38.90835	u1	Admin	Đăng nhập	OK
LOG2605171300001	2026-05-17 13:00:46.515209	u1	Admin	Đăng nhập	OK
LOG2605171503001	2026-05-17 15:03:29.334028	u1	Admin	Đăng nhập	OK
LOG2605171509001	2026-05-17 15:09:31.487128	u1	Admin	Đăng nhập	OK
LOG2605171518001	2026-05-17 15:18:33.927292	u1	Admin	Đăng nhập	OK
LOG2605171547001	2026-05-17 15:47:28.940299	u1	Admin	Đăng nhập	OK
LOG2605171551001	2026-05-17 15:51:06.748075	u1	Admin	Đăng nhập	OK
LOG2605171604001	2026-05-17 16:04:09.093854	u1	Admin	Đăng nhập	OK
LOG2605171615001	2026-05-17 16:15:31.948783	u1	Admin	Đăng nhập	OK
LOG2605171626001	2026-05-17 16:26:51.477823	u1	Admin	Đăng nhập	OK
LOG2605171634001	2026-05-17 16:34:15.889586	u1	Admin	Đăng nhập	OK
LOG2605171635001	2026-05-17 16:35:08.171393	u1	Admin	Đăng nhập	OK
LOG2605171639001	2026-05-17 16:39:41.065766	u1	Admin	Đăng nhập	OK
LOG2605171644001	2026-05-17 16:44:12.201563	u1	Admin	Đăng nhập	OK
LOG2605171650001	2026-05-17 16:50:44.41452	u1	Admin	Đăng nhập	OK
LOG2605171657001	2026-05-17 16:57:44.476997	u1	Admin	Đăng nhập	OK
LOG2605171703001	2026-05-17 17:03:36.752804	u1	Admin	Đăng nhập	OK
LOG2605171711001	2026-05-17 17:11:10.870941	u1	Admin	Đăng nhập	OK
LOG2605171716001	2026-05-17 17:16:10.765492	u1	Admin	Đăng nhập	OK
LOG2605171720001	2026-05-17 17:20:27.238578	u1	Admin	Đăng nhập	OK
LOG2605171726001	2026-05-17 17:26:57.156745	u1	Admin	Đăng nhập	OK
LOG2605171732001	2026-05-17 17:32:32.161897	u1	Admin	Đăng nhập	OK
LOG2605171754001	2026-05-17 17:54:10.802807	u1	Admin	Đăng nhập	OK
LOG2605171802001	2026-05-17 18:02:18.774562	u1	Admin	Đăng nhập	OK
LOG2605171806001	2026-05-17 18:06:32.919387	u1	Admin	Đăng nhập	OK
LOG2605171811001	2026-05-17 18:11:45.935338	u1	Admin	Đăng nhập	OK
LOG2605171815001	2026-05-17 18:15:08.512067	u1	Admin	Đăng nhập	OK
LOG2605171817001	2026-05-17 18:17:07.582905	u1	Admin	Đăng nhập	OK
LOG2605171935001	2026-05-17 19:35:55.345348	u1	Admin	Đăng nhập	OK
LOG2605172022002	2026-05-17 20:22:43.739402	u1	Admin	Đăng xuất	OK
LOG2605172022003	2026-05-17 20:22:48.480515	u1	Admin	Đăng nhập	OK
LOG2605172031001	2026-05-17 20:31:10.868445	u1	Admin	Đăng nhập	OK
LOG2605172035002	2026-05-17 20:35:34.053565	u1	Admin	Đăng xuất	OK
LOG2605172035003	2026-05-17 20:35:48.224561	u1	Admin	Đăng nhập	OK
LOG2605172038004	2026-05-17 20:38:27.852072	u1	Admin	Đăng xuất	OK
LOG2605172038005	2026-05-17 20:38:31.969977	u1	Admin	Đăng nhập	OK
LOG2605172040006	2026-05-17 20:40:43.870788	u1	Admin	Đăng xuất	OK
LOG2605172040007	2026-05-17 20:40:48.564128	u1	Admin	Đăng nhập	OK
LOG2605172042001	2026-05-17 20:42:33.843459	u1	Admin	Đăng nhập	OK
LOG2605172055001	2026-05-17 20:55:05.681102	u1	Admin	Đăng nhập	OK
LOG2605172057001	2026-05-17 20:57:52.091425	u1	Admin	Đăng nhập	OK
LOG2605172101002	2026-05-17 21:01:32.639524	u1	Admin	Đăng xuất	OK
LOG2605172101003	2026-05-17 21:01:36.455714	u1	Admin	Đăng nhập	OK
LOG2605172101004	2026-05-17 21:01:57.37673	u1	Admin	Đăng xuất	OK
LOG2605172102005	2026-05-17 21:02:01.301185	u1	Admin	Đăng nhập	OK
LOG2605172217001	2026-05-17 22:17:32.30752	u1	Admin	Đăng nhập	OK
LOG2605172226001	2026-05-17 22:26:22.200277	u1	Admin	Đăng nhập	OK
LOG2605172228001	2026-05-17 22:28:09.060259	u1	Admin	Đăng nhập	OK
LOG2605172237001	2026-05-17 22:37:35.538583	u1	Admin	Đăng nhập	OK
LOG2605172238002	2026-05-17 22:38:22.511104	u1	Admin	Đăng xuất	OK
LOG2605172238003	2026-05-17 22:38:44.842271	u1	Admin	Đăng nhập	OK
LOG2605172238004	2026-05-17 22:38:53.547902	u1	Admin	Đăng xuất	OK
LOG2605172239005	2026-05-17 22:39:17.017579	u1	Admin	Đăng nhập	OK
LOG2605172240006	2026-05-17 22:40:39.169178	u1	Admin	Đăng xuất	OK
LOG2605172300001	2026-05-17 23:00:02.598555	u1	Admin	Đăng nhập	OK
LOG2605172300002	2026-05-17 23:00:24.904722	u1	Admin	Đăng xuất	OK
LOG2605172300003	2026-05-17 23:00:29.172056	u1	Admin	Đăng nhập	OK
LOG2605172302001	2026-05-17 23:02:40.984413	u1	Admin	Đăng nhập	OK
LOG2605172311002	2026-05-17 23:11:01.520493	u1	Admin	Đăng xuất	OK
LOG2605172311003	2026-05-17 23:11:18.94027	u1	Admin	Đăng nhập	OK
LOG2605172312004	2026-05-17 23:12:34.465519	u1	Admin	Đăng xuất	OK
LOG2605172312005	2026-05-17 23:12:41.20563	u1	Admin	Đăng nhập	OK
LOG2605172315006	2026-05-17 23:15:47.435166	u1	Admin	Đăng xuất	OK
LOG2605172316001	2026-05-17 23:16:07.432797	u1	Admin	Đăng nhập	OK
LOG2605172316002	2026-05-17 23:16:13.318071	u1	Admin	Đăng xuất	OK
LOG2605172316003	2026-05-17 23:16:17.548119	u1	Admin	Đăng nhập	OK
LOG2605172334001	2026-05-17 23:34:49.265783	u1	Admin	Đăng nhập	OK
LOG2605172341001	2026-05-17 23:41:59.574662	u1	Admin	Đăng nhập	OK
LOG2605172349001	2026-05-17 23:49:10.170695	u1	Admin	Đăng nhập	OK
LOG2605172352001	2026-05-17 23:52:33.138215	u1	Admin	Đăng nhập	OK
LOG2605180002001	2026-05-18 00:02:26.295686	u1	Admin	Đăng nhập	OK
LOG2605180005001	2026-05-18 00:05:44.010738	u1	Admin	Đăng nhập	OK
LOG2605180015001	2026-05-18 00:15:52.604089	u1	Admin	Đăng nhập	OK
LOG2605180037001	2026-05-18 00:37:50.296429	u1	Admin	Đăng nhập	OK
LOG2605180041001	2026-05-18 00:41:21.819113	u1	Admin	Đăng nhập	OK
LOG2605180043001	2026-05-18 00:43:27.351999	u1	Admin	Đăng nhập	OK
LOG2605180045001	2026-05-18 00:45:46.755431	u1	Admin	Đăng nhập	OK
LOG2605180048001	2026-05-18 00:48:23.349119	u1	Admin	Đăng nhập	OK
LOG2605180816001	2026-05-18 08:16:15.432822	u1	Admin	Đăng nhập	OK
LOG2605180824001	2026-05-18 08:24:18.369615	u1	Admin	Đăng nhập	OK
LOG2605180834001	2026-05-18 08:34:00.537154	u1	Admin	Đăng nhập	OK
LOG2605180837001	2026-05-18 08:37:32.813421	u1	Admin	Đăng nhập	OK
LOG2605180842001	2026-05-18 08:42:12.552554	u1	Admin	Đăng nhập	OK
LOG2605180845001	2026-05-18 08:45:10.942007	u1	Admin	Đăng nhập	OK
LOG2605180848001	2026-05-18 08:48:49.551241	u1	Admin	Đăng nhập	OK
LOG2605180858001	2026-05-18 08:58:24.471247	u1	Admin	Đăng nhập	OK
LOG2605180906001	2026-05-18 09:06:58.763292	u1	Admin	Đăng nhập	OK
LOG2605180918001	2026-05-18 09:18:19.70545	u1	Admin	Đăng nhập	OK
LOG2605180927001	2026-05-18 09:27:33.780457	u1	Admin	Đăng nhập	OK
LOG2605180937001	2026-05-18 09:37:08.846549	u1	Admin	Đăng nhập	OK
LOG2605180941002	2026-05-18 09:41:23.592135	u1	Admin	Đăng xuất	OK
LOG2605180941003	2026-05-18 09:41:29.240925	u1	Admin	Đăng nhập	OK
LOG2605180947001	2026-05-18 09:47:48.325502	u1	Admin	Đăng nhập	OK
LOG2605180950001	2026-05-18 09:50:24.869225	u1	Admin	Đăng nhập	OK
LOG2605180951001	2026-05-18 09:51:12.499393	u1	Admin	Đăng nhập	OK
LOG2605180957001	2026-05-18 09:57:57.551717	u1	Admin	Đăng nhập	OK
LOG2605181009001	2026-05-18 10:09:45.730968	u1	Admin	Đăng nhập	OK
LOG2605181015001	2026-05-18 10:15:41.544475	u1	Admin	Đăng nhập	OK
LOG2605181020001	2026-05-18 10:20:17.619013	u1	Admin	Đăng nhập	OK
LOG2605181032001	2026-05-18 10:32:52.907379	u1	Admin	Đăng nhập	OK
LOG2605181037001	2026-05-18 10:37:01.296314	u1	Admin	Đăng nhập	OK
LOG2605181048001	2026-05-18 10:48:54.507765	u1	Admin	Đăng nhập	OK
LOG2605181056001	2026-05-18 10:56:26.202991	u1	Admin	Đăng nhập	OK
LOG2605181109001	2026-05-18 11:09:35.302993	u1	Admin	Đăng nhập	OK
LOG2605181111001	2026-05-18 11:11:56.525748	u1	Admin	Đăng nhập	OK
LOG2605181112001	2026-05-18 11:12:38.10994	u1	Admin	Đăng nhập	OK
LOG2605181115001	2026-05-18 11:15:48.342568	u1	Admin	Đăng nhập	OK
LOG2605181119001	2026-05-18 11:19:15.720019	u1	Admin	Đăng nhập	OK
LOG2605181125001	2026-05-18 11:25:54.508994	u1	Admin	Đăng nhập	OK
LOG2605181158001	2026-05-18 11:58:19.016363	u1	Admin	Đăng nhập	OK
LOG2605181330001	2026-05-18 13:30:31.401154	u1	Admin	Đăng nhập	OK
LOG2605181334001	2026-05-18 13:34:58.644629	u1	Admin	Đăng nhập	OK
LOG2605181338001	2026-05-18 13:38:34.173389	u1	Admin	Đăng nhập	OK
LOG2605181341001	2026-05-18 13:41:00.312019	u1	Admin	Đăng nhập	OK
LOG2605181345001	2026-05-18 13:45:15.885292	u1	Admin	Đăng nhập	OK
LOG2605181346001	2026-05-18 13:46:49.386491	u1	Admin	Đăng nhập	OK
LOG2605181351001	2026-05-18 13:51:46.655538	u1	Admin	Đăng nhập	OK
LOG2605181354001	2026-05-18 13:54:23.796771	u1	Admin	Đăng nhập	OK
LOG2605181359001	2026-05-18 13:59:44.856099	u1	Admin	Đăng nhập	OK
LOG2605181401002	2026-05-18 14:01:05.833373	u1	Admin	Chuyển kho CK	Thép hình H200x200x8x12: 22 tấn, Thép hình H200x200x8x12: 2222 tấn
LOG2605181401003	2026-05-18 14:01:15.300983	u1	Admin	Chuyển kho CK	Thép hình H200x200x8x12: 22 tấn, Thép hình H200x200x8x12: 22 tấn
LOG2605181401004	2026-05-18 14:01:32.748905	u1	Admin	Chuyển kho CK	Thép tấm SS400 dày 10mm: 11 tấn
LOG2605181402005	2026-05-18 14:02:46.804824	u1	Admin	Xuất kho	Thép tấm SS400 dày 10mm - SL: 30 - 731.939.010 ₫
LOG2605181403006	2026-05-18 14:03:05.714158	u1	Admin	Chuyển kho CK	Thép hình H200x200x8x12: 12 tấn
LOG2605181404007	2026-05-18 14:04:07.891426	u1	Admin	Chuyển kho CK	Ống thép D90x3.2: 10 tấn
LOG2605181404008	2026-05-18 14:04:15.701997	u1	Admin	Chuyển kho CK	Ống thép D90x3.2: 9.455 tấn
LOG2605181404001	2026-05-18 14:04:41.632086	u1	Admin	Đăng nhập	OK
LOG2605181408001	2026-05-18 14:08:44.731445	u1	Admin	Đăng nhập	OK
LOG2605181410001	2026-05-18 14:10:13.362313	u1	Admin	Đăng nhập	OK
LOG2605181416001	2026-05-18 14:16:36.804469	u1	Admin	Đăng nhập	OK
LOG2605181418002	2026-05-18 14:18:16.760771	u1	Admin	Nhập kho	Xà gồ C150x50x20x2.0 - SL: 2.222 - 465.475.892 ₫ - NCC: Công ty Thép Hòa Phát Miền Nam
LOG2605181419001	2026-05-18 14:19:18.990768	u1	Admin	Đăng nhập	OK
LOG2605181421001	2026-05-18 14:21:52.322389	u1	Admin	Đăng nhập	OK
LOG2605181423002	2026-05-18 14:23:48.672857	u1	Admin	Nhập kho	Ống thép D90x3.2 - SL: 333 - 9.430.251.376 ₫ - NCC: Công ty Thép Hòa Phát Miền Nam
LOG2605181425001	2026-05-18 14:25:17.031854	u1	Admin	Đăng nhập	OK
LOG2605181427001	2026-05-18 14:27:46.831429	u1	Admin	Đăng nhập	OK
LOG2605181430001	2026-05-18 14:30:27.118067	u1	Admin	Đăng nhập	OK
LOG2605181432001	2026-05-18 14:32:58.343405	u1	Admin	Đăng nhập	OK
LOG2605181436001	2026-05-18 14:36:39.643853	u1	Admin	Đăng nhập	OK
LOG2605181443001	2026-05-18 14:43:36.031757	u1	Admin	Đăng nhập	OK
LOG2605181443002	2026-05-18 14:43:40.072813	u1	Admin	Export Excel	Xuất danh sách vật tư ra Excel - 20 mặt hàng
LOG2605181450001	2026-05-18 14:50:18.068301	u1	Admin	Đăng nhập	OK
LOG2605181543001	2026-05-18 15:43:15.882789	u1	Admin	Đăng nhập	OK
LOG2605181545001	2026-05-18 15:45:41.349146	u1	Admin	Đăng nhập	OK
LOG2605181546001	2026-05-18 15:46:10.531719	u1	Admin	Đăng nhập	OK
LOG2605181548001	2026-05-18 15:48:28.287255	u1	Admin	Đăng nhập	OK
LOG2605181551001	2026-05-18 15:51:27.786814	u1	Admin	Đăng nhập	OK
LOG2605181735001	2026-05-18 17:36:04.595718	u1	Admin	Đăng nhập	OK
LOG2605181825001	2026-05-18 18:25:02.261516	u1	Admin	Đăng nhập	OK
LOG2605182131001	2026-05-18 21:31:09.062338	u1	Admin	Đăng nhập	OK
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materials (id, name, cat, unit, qty, cost, low, note) FROM stdin;
M002	Thép hình H300x300x10x15	Thép hình	tấn	1.346	27214469.00	15	Dữ liệu mẫu sạch 2023-2026
M003	Thép I250x125x6x9	Thép hình	tấn	24.204	23771576.00	20	Dữ liệu mẫu sạch 2023-2026
M004	Thép U200x75x8.5	Thép hình	tấn	28.187	23922883.00	20	Dữ liệu mẫu sạch 2023-2026
M005	Thép tấm SS400 dày 6mm	Thép tấm	tấn	4.828	24216710.00	25	Dữ liệu mẫu sạch 2023-2026
M007	Thép tấm SS400 dày 16mm	Thép tấm	tấn	3.589	26188685.00	18	Dữ liệu mẫu sạch 2023-2026
M008	Thép hộp 100x100x4	Thép hộp	tấn	34.808	27411599.00	12	Dữ liệu mẫu sạch 2023-2026
M009	Thép hộp 150x150x5	Thép hộp	tấn	24.815	27791227.00	10	Dữ liệu mẫu sạch 2023-2026
M011	Ống thép D114x4.0	Ống thép	tấn	17.330	28396260.00	10	Dữ liệu mẫu sạch 2023-2026
M012	Bu lông neo M24x700	Bu lông - Ốc vít	cái	20423.000	74062.00	120	Dữ liệu mẫu sạch 2023-2026
M013	Bu lông cường độ cao M20x70	Bu lông - Ốc vít	cái	34066.000	23953.00	500	Dữ liệu mẫu sạch 2023-2026
M014	Bu lông cường độ cao M22x80	Bu lông - Ốc vít	cái	12352.000	28119.00	400	Dữ liệu mẫu sạch 2023-2026
M015	Que hàn E7018 phi 4.0	Vật tư hàn cắt	kg	2749.000	48173.00	800	Dữ liệu mẫu sạch 2023-2026
M016	Dây hàn lõi thuốc E71T-1	Vật tư hàn cắt	kg	5239.000	58692.00	600	Dữ liệu mẫu sạch 2023-2026
M017	Đá cắt inox 355mm	Vật tư hàn cắt	cái	1901.000	43853.00	150	Dữ liệu mẫu sạch 2023-2026
M018	Sơn chống gỉ epoxy xám	Sơn - Chống gỉ	thùng	744.000	1745422.00	20	Dữ liệu mẫu sạch 2023-2026
M019	Sơn phủ polyurethane xanh	Sơn - Chống gỉ	thùng	12.000	2009011.00	18	Dữ liệu mẫu sạch 2023-2026
M006	Thép tấm SS400 dày 10mm	Thép tấm	tấn	3.209	24397967.00	22	Dữ liệu mẫu sạch 2023-2026
M001	Thép hình H200x200x8x12	Thép hình	tấn	29.474	26006473.00	18	Dữ liệu mẫu sạch 2023-2026
M020	Xà gồ C150x50x20x2.0	Thép hộp	mét	2247.000	130441.00	800	Dữ liệu mẫu sạch 2023-2026
M010	Ống thép D90x3.2	Ống thép	tấn	333.000	25744612.00	10	Dữ liệu mẫu sạch 2023-2026
\.


--
-- Data for Name: project_material_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_material_usage (project_id, material_id, used_qty) FROM stdin;
P0024	M009	2.952
P0025	M008	6.225
P0026	M008	12.513
P0027	M006	3.334
P0027	M012	904
P0028	M007	9.828
P0029	M018	44
P0030	M012	1075
P0030	M013	13222
P0031	M006	7.955
P0032	M007	2.486
P0033	M005	18.045
P0034	M009	10.543
P0035	M018	228
P0036	M007	3.1
P0029	M006	6.923
P0030	M007	9.929
P0031	M015	4305
P0032	M019	111
P0032	M002	12.351
P0033	M015	2620
P0034	M001	15.104
P0035	M011	9.184
P0036	M018	212
P0037	M015	5164
P0038	M006	10.887
P0038	M011	7.788
P0039	M002	8.761
P0040	M005	4.743
P0001	M019	129
P0034	M016	1831
P0035	M010	7.392
P0036	M004	14.619
P0037	M012	3910
P0037	M016	9822
P0038	M002	3.438
P0039	M006	49.09
P0040	M001	9.017
P0040	M016	6501
P0001	M010	10.839
P0002	M008	7.356
P0003	M015	9876
P0004	M012	4014
P0005	M016	2281
P0006	M005	19.063
P0007	M008	22.573
P0008	M015	8214
P0039	M019	117
P0040	M015	2218
P0001	M004	5.098
P0002	M001	33.287
P0003	M019	129
P0002	M011	15.529
P0003	M005	35.311
P0004	M002	9.989
P0005	M002	7.833
P0006	M015	6351
P0007	M015	5731
P0005	M020	3785
P0006	M011	12.681
P0007	M004	5.903
P0008	M018	172
P0009	M009	4.812
P0010	M005	15.205
P0011	M018	184
P0012	M009	7.351
P0013	M020	1035
P0004	M008	9.864
P0005	M006	22.545
P0007	M016	1868
P0008	M003	3.999
P0009	M011	4.243
P0010	M006	14.653
P0011	M015	7907
P0010	M011	6.369
P0011	M016	2271
P0012	M011	4.44
P0013	M018	162
P0014	M015	4905
P0015	M008	2.808
P0016	M006	7.352
P0017	M015	2895
P0018	M011	43.609
P0009	M005	7.532
P0010	M009	20.534
P0011	M013	25776
P0012	M008	13.322
P0013	M005	13.798
P0012	M005	18.691
P0014	M013	18872
P0015	M001	8.838
P0016	M002	18.676
P0015	M005	10.921
P0016	M009	11.171
P0017	M011	10.57
P0018	M009	13.165
P0019	M019	138
P0020	M006	11.552
P0021	M007	6.967
P0022	M001	10.581
P0023	M007	8.45
P0014	M011	9.209
P0015	M017	4202
P0017	M008	9.112
P0019	M005	4.323
P0017	M017	8508
P0018	M020	730
P0019	M017	1118
P0021	M014	3358
P0020	M001	3.909
P0021	M002	9.08
P0022	M008	11.25
P0023	M015	1899
P0024	M008	7.964
P0025	M002	2.652
P0023	M018	53
P0024	M017	2281
P0025	M018	238
P0026	M009	0.386
P0019	M006	4.55
P0022	M014	4211
P0023	M003	20.763
P0022	M004	12.13
P0023	M002	10.085
P0024	M014	4966
P0026	M001	13.786
P0027	M016	1891
P0028	M012	4055
P0029	M015	13074
P0028	M003	15.862
P0030	M004	9.121
P0031	M005	18.231
P0032	M005	32.991
P0024	M016	15107
P0025	M004	8.429
P0026	M004	8.579
P0027	M015	3150
P0028	M018	169
P0029	M010	3.998
P0030	M019	218
P0031	M019	81
P0032	M013	14840
P0033	M010	12.756
P0033	M018	284
P0034	M015	4303
P0029	M012	4811
P0030	M009	6.148
P0031	M017	1708
P0032	M018	43
P0033	M012	3160
P0032	M012	3099
P0035	M005	7.371
P0036	M005	6.207
P0037	M002	10.721
P0038	M018	190
P0039	M017	5132
P0040	M009	5.053
P0034	M011	3.356
P0035	M012	1199
P0036	M016	8430
P0037	M001	14.205
P0038	M001	10.613
P0038	M016	7786
P0039	M015	1994
P0001	M001	8.016
P0002	M019	76
P0001	M011	3.891
P0002	M020	1483
P0003	M002	14.342
P0004	M016	2183
P0006	M002	3.264
P0039	M005	1.496
P0040	M020	13133
P0001	M007	13.974
P0002	M013	4710
P0002	M016	3503
P0003	M018	295
P0004	M006	12.035
P0005	M014	11897
P0005	M012	6147
P0006	M017	5301
P0007	M013	16786
P0008	M012	1959
P0008	M020	1795
P0009	M007	8.659
P0010	M020	2712
P0011	M006	6.747
P0012	M014	7182
P0013	M006	8.191
P0025	M006	4.526
P0027	M003	3.332
P0029	M003	3.808
P0030	M011	2.637
P0031	M020	1418
P0032	M011	11.406
P0031	M018	264
P0032	M003	5.729
P0033	M014	4328
P0035	M014	8484
P0034	M020	678
P0036	M006	7.414
P0032	M020	1680
P0033	M008	6.977
P0033	M001	4.041
P0034	M007	4.54
P0035	M017	2161
P0036	M008	9.005
P0037	M020	1932
P0038	M008	9.291
P0040	M018	570
P0039	M012	700
P0040	M019	65
P0036	M015	3002
P0037	M014	7578
P0038	M005	11.114
P0039	M013	7274
P0001	M015	4116
P0002	M012	3323
P0005	M013	12111
P0006	M014	16547
P0004	M017	8619
P0007	M018	82
P0040	M003	11.508
P0001	M008	5.369
P0002	M002	6.344
P0003	M012	3090
P0004	M014	6936
P0006	M012	5038
P0007	M002	13.278
P0006	M003	10.546
P0007	M010	22.906
P0009	M015	9509
P0010	M018	145
P0009	M012	1824
P0011	M001	22.302
P0012	M018	133
P0013	M003	18.868
P0006	M016	3167
P0008	M017	13683
P0009	M013	28065
P0010	M012	4211
P0008	M006	12.037
P0010	M008	7.215
P0011	M020	3968
P0012	M002	4.611
P0013	M012	4778
P0012	M001	14.828
P0013	M002	3.232
P0014	M020	1749
P0015	M015	2227
P0014	M008	5.026
P0015	M003	5.561
P0010	M019	98
P0013	M008	13.051
P0014	M005	12.595
P0015	M016	6566
P0014	M017	5236
P0015	M013	7510
P0017	M019	113
P0016	M013	16885
P0017	M014	6658
P0018	M012	5768
P0019	M013	23054
P0020	M020	746
P0021	M019	78
P0015	M019	55
P0019	M015	34197
P0020	M008	7.53
P0018	M019	54
P0020	M005	4.92
P0021	M001	3.893
P0021	M015	2214
P0022	M002	9.726
P0023	M013	3221
P0027	M008	2.908
P0021	M008	5.05
P0023	M004	9.967
P0024	M005	3.379
P0027	M005	4.214
P0027	M004	5.616
P0028	M004	10.911
P0029	M005	3.329
P0029	M002	3.804
P0030	M002	4.638
P0025	M020	637
P0026	M002	3.197
P0027	M020	2032
P0028	M010	6.571
P0032	M004	8.626
P0033	M006	9.683
P0034	M002	13.096
P0035	M006	8.775
P0037	M017	3234
P0031	M004	8.106
P0032	M010	11.552
P0033	M003	3.934
P0034	M004	6.908
P0036	M014	10174
P0037	M007	8.316
P0038	M010	16.265
P0040	M004	2.449
P0001	M013	4500
P0035	M009	1.158
P0036	M017	1229
P0037	M011	10.263
P0038	M017	3043
P0040	M008	6.785
P0001	M002	18.825
P0001	M003	4.546
P0002	M009	15.218
P0004	M001	1.698
P0005	M008	1.938
P0007	M019	25
P0040	M013	6090
P0003	M010	12.871
P0004	M019	89
P0005	M015	992
P0009	M017	3612
P0009	M001	5.288
P0011	M002	3.211
P0026	M015	945
P0027	M018	124
P0028	M015	1804
P0029	M009	3.176
P0030	M017	1421
P0031	M001	6.875
P0029	M020	670
P0031	M002	6.007
P0032	M015	1066
P0033	M020	777
P0033	M017	2446
P0035	M020	762
P0036	M002	4.964
P0035	M001	4.384
P0036	M001	6.948
P0033	M009	3.82
P0034	M003	2.358
P0035	M004	6.026
P0034	M005	4.862
P0036	M019	38
P0037	M010	4.169
P0039	M009	19.04
P0040	M014	8115
P0001	M017	9254
P0004	M005	4.883
P0038	M020	2177
P0039	M016	3624
P0001	M014	5082
P0004	M010	16.432
P0003	M004	8.727
P0005	M017	3608
P0006	M006	16.231
P0007	M007	15.045
P0005	M003	11.503
P0003	M014	4040
P0004	M013	5014
P0004	M020	875
P0008	M005	10.368
P0009	M020	775
P0009	M008	8.368
P0012	M016	8017
P0008	M016	6771
P0009	M002	10.288
P0010	M015	2018
P0011	M005	6.452
P0013	M007	5.794
P0015	M002	10.066
P0016	M018	59
P0018	M008	2.479
P0012	M004	7.133
P0014	M007	19.783
P0014	M016	2490
P0015	M011	9.292
P0016	M019	265
P0017	M007	10.174
P0020	M012	2684
P0021	M016	4354
P0022	M019	120
P0011	M007	4.993
P0017	M009	4.124
P0018	M004	7.021
P0019	M011	3.404
P0020	M009	3.706
P0021	M005	2.358
P0022	M017	5639
P0023	M008	6.333
P0024	M011	4.412
P0026	M003	9.59
P0027	M007	5.284
P0028	M006	8.279
P0021	M010	2.616
P0024	M019	38
P0025	M010	6.056
P0026	M020	541
P0027	M002	3.352
P0029	M014	5568
P0030	M003	7.982
P0030	M010	9.659
P0031	M003	4.271
P0032	M001	4.364
P0026	M010	6.903
P0027	M001	3.821
P0028	M002	5.797
P0029	M019	54
P0029	M007	3.806
P0034	M010	9.68
P0035	M002	2.92
P0037	M009	18.054
P0038	M012	2622
P0034	M018	103
P0035	M016	1998
P0034	M019	75
P0035	M019	78
P0036	M003	8.202
P0038	M019	57
P0039	M001	8.177
P0040	M002	9.712
P0040	M010	9.693
P0001	M009	7.63
P0037	M018	93
P0038	M003	4.395
P0039	M020	1815
P0039	M010	6.442
P0005	M010	7.717
P0007	M003	3.335
P0001	M016	1980
P0002	M004	7.957
P0004	M004	5.534
P0004	M009	8.297
P0006	M009	3.048
P0009	M003	5.978
P0010	M014	3738
P0011	M003	7.46
P0030	M006	5.658
P0034	M013	5632
P0033	M004	3.305
P0037	M013	1614
P0033	M016	829
P0036	M009	24.818
P0035	M003	4.341
P0036	M020	874
P0037	M019	52
P0040	M011	5.518
P0001	M006	3.178
P0006	M001	27.14
P0039	M007	8.577
P0040	M006	9.781
P0002	M006	8.465
P0002	M015	3562
P0003	M006	5.872
P0005	M005	6.52
P0007	M009	9.122
P0002	M017	3105
P0003	M003	6.923
P0005	M001	8.707
P0006	M019	55
P0005	M011	8.553
P0006	M004	4.647
P0007	M011	4.637
P0010	M004	8.349
P0011	M014	9227
P0012	M017	3398
P0013	M010	6.948
P0007	M001	3.306
P0008	M008	2.183
P0010	M016	3171
P0015	M007	5.976
P0016	M005	8.41
P0016	M011	4.641
P0018	M001	3.608
\.


--
-- Data for Name: project_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_schedules (project_id, data) FROM stdin;
P0015	{"data": {"tasks": [], "endDate": null, "progress": 0, "projectId": "P0015", "startDate": "2026-05-17", "totalDays": 0, "completedDays": 0}, "tasks": [], "endDate": null, "progress": 0, "projectId": "P0015", "startDate": "2026-05-17", "totalDays": 0, "project_id": "P0015", "completedDays": 0}
P0040	{"data": {"tasks": [], "endDate": null, "progress": 0, "projectId": "P0040", "startDate": "2026-05-17", "totalDays": 0, "completedDays": 0}, "tasks": [], "endDate": null, "progress": 0, "projectId": "P0040", "startDate": "2026-05-17", "totalDays": 0, "project_id": "P0040", "completedDays": 0}
P0002	{"data": {"tasks": [], "endDate": null, "progress": 0, "projectId": "P0002", "startDate": "2026-05-18", "totalDays": 0, "completedDays": 0}, "tasks": [], "endDate": null, "progress": 0, "projectId": "P0002", "startDate": "2026-05-18", "totalDays": 0, "project_id": "P0002", "completedDays": 0}
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, budget, spent) FROM stdin;
P0001	Nhà xưởng Sunrise Long An	3200000000.00	3284861795.42
P0002	Kho lạnh Mekong Logistics	3650000000.00	3567322487.10
P0003	Nhà máy bao bì Tân Phú	4100000000.00	3622489426.97
P0004	Xưởng cơ khí Bình Dương	4550000000.00	3147981807.29
P0005	Trung tâm phân phối An Sương	5000000000.00	3701507513.05
P0006	Nhà máy thực phẩm GreenFarm	5450000000.00	4015964353.72
P0007	Kho thép Phú Mỹ	5900000000.00	3522379188.08
P0008	Nhà xưởng may Phước Đông	6350000000.00	2726617294.10
P0009	Nhà máy nhựa Nam Việt	3200000000.00	2959593360.36
P0010	Khu bảo trì xe buýt Củ Chi	3650000000.00	3234394165.25
P0011	Nhà máy gỗ Đức Hòa	4100000000.00	3232203565.34
P0012	Kho tổng hợp Sóng Thần	4550000000.00	2757153901.25
P0013	Nhà xưởng điện tử VSIP	5000000000.00	2472017111.21
P0014	Nhà máy thức ăn chăn nuôi Đồng Nai	5450000000.00	2446931836.26
P0015	Kho hàng cảng Cát Lái	5900000000.00	2311157653.82
P0016	Xưởng sản xuất nội thất Hóc Môn	6350000000.00	2250213637.84
P0017	Nhà máy dược phẩm Tân Uyên	3200000000.00	1832546113.22
P0018	Trạm logistics Nhơn Trạch	3650000000.00	2532824675.52
P0019	Nhà xưởng cơ điện Quận 12	4100000000.00	2755102526.92
P0020	Kho nguyên liệu Bến Lức	4550000000.00	1181792123.03
P0021	Nhà máy giấy Mỹ Phước	5000000000.00	1332833927.71
P0022	Xưởng lắp ráp xe điện	5450000000.00	1682895158.56
P0023	Nhà máy nước giải khát Tây Ninh	5900000000.00	1629032898.87
P0024	Kho phân phối Bình Chánh	6350000000.00	1597311835.62
P0025	Nhà máy sơn Long Thành	3200000000.00	1216553733.61
P0026	Xưởng bao bì carton Cần Giuộc	3650000000.00	1503979596.36
P0027	Nhà máy cơ khí chính xác Biên Hòa	4100000000.00	1616724739.02
P0028	Kho lạnh thủy sản Vũng Tàu	4550000000.00	2103845149.32
P0029	Nhà xưởng phụ trợ Dĩ An	5000000000.00	2140774650.04
P0030	Trung tâm vận hành Đức Trọng	5450000000.00	2281011938.41
P0031	Nhà máy phân bón Long An	5900000000.00	2232594846.39
P0032	Kho vật tư công nghiệp Tân Tạo	6350000000.00	3227818021.75
P0033	Nhà xưởng sản xuất pallet	3200000000.00	2655738504.66
P0034	Nhà máy nông sản Cái Bè	3650000000.00	2618449586.72
P0035	Xưởng gia công thép Thủ Đức	4100000000.00	2374892037.29
P0036	Kho ngoại quan Hiệp Phước	4550000000.00	3504735613.10
P0037	Nhà máy điện mặt trời phụ trợ	5000000000.00	3449077474.77
P0038	Trung tâm bảo trì thiết bị	5450000000.00	3271697504.57
P0039	Nhà máy chế biến gạo Sa Đéc	5900000000.00	3619575413.17
P0040	Xưởng sản xuất container module	6350000000.00	5398569754.19
\.


--
-- Data for Name: structure_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.structure_materials (structure_id, material_id, material_name, unit, quantity, id) FROM stdin;
K0001	M001	Thép hình H200x200x8x12	tấn	0.15	1
K0001	M002	Thép hình H300x300x10x15	tấn	0.23	2
K0001	M003	Thép I250x125x6x9	tấn	0.31	3
K0002	M004	Thép U200x75x8.5	tấn	0.15	4
K0002	M005	Thép tấm SS400 dày 6mm	tấn	0.23	5
K0002	M006	Thép tấm SS400 dày 10mm	tấn	0.31	6
K0003	M007	Thép tấm SS400 dày 16mm	tấn	0.15	7
K0003	M008	Thép hộp 100x100x4	tấn	0.23	8
K0003	M009	Thép hộp 150x150x5	tấn	0.31	9
K0004	M010	Ống thép D90x3.2	tấn	0.15	10
K0004	M011	Ống thép D114x4.0	tấn	0.23	11
K0004	M012	Bu lông neo M24x700	cái	0.31	12
K0005	M013	Bu lông cường độ cao M20x70	cái	0.15	13
K0005	M014	Bu lông cường độ cao M22x80	cái	0.23	14
K0005	M015	Que hàn E7018 phi 4.0	kg	0.31	15
K0006	M016	Dây hàn lõi thuốc E71T-1	kg	0.15	16
K0006	M017	Đá cắt inox 355mm	cái	0.23	17
K0006	M018	Sơn chống gỉ epoxy xám	thùng	0.31	18
K0007	M019	Sơn phủ polyurethane xanh	thùng	0.15	19
K0007	M020	Xà gồ C150x50x20x2.0	mét	0.23	20
K0007	M001	Thép hình H200x200x8x12	tấn	0.31	21
K0008	M002	Thép hình H300x300x10x15	tấn	0.15	22
K0008	M003	Thép I250x125x6x9	tấn	0.23	23
K0008	M004	Thép U200x75x8.5	tấn	0.31	24
K0009	M005	Thép tấm SS400 dày 6mm	tấn	0.15	25
K0009	M006	Thép tấm SS400 dày 10mm	tấn	0.23	26
K0009	M007	Thép tấm SS400 dày 16mm	tấn	0.31	27
K0010	M008	Thép hộp 100x100x4	tấn	0.15	28
K0010	M009	Thép hộp 150x150x5	tấn	0.23	29
K0010	M010	Ống thép D90x3.2	tấn	0.31	30
K0011	M011	Ống thép D114x4.0	tấn	0.15	31
K0011	M012	Bu lông neo M24x700	cái	0.23	32
K0011	M013	Bu lông cường độ cao M20x70	cái	0.31	33
K0012	M014	Bu lông cường độ cao M22x80	cái	0.15	34
K0012	M015	Que hàn E7018 phi 4.0	kg	0.23	35
K0012	M016	Dây hàn lõi thuốc E71T-1	kg	0.31	36
K0013	M017	Đá cắt inox 355mm	cái	0.15	37
K0013	M018	Sơn chống gỉ epoxy xám	thùng	0.23	38
K0013	M019	Sơn phủ polyurethane xanh	thùng	0.31	39
K0014	M020	Xà gồ C150x50x20x2.0	mét	0.15	40
K0014	M001	Thép hình H200x200x8x12	tấn	0.23	41
K0014	M002	Thép hình H300x300x10x15	tấn	0.31	42
K0015	M003	Thép I250x125x6x9	tấn	0.15	43
K0015	M004	Thép U200x75x8.5	tấn	0.23	44
K0015	M005	Thép tấm SS400 dày 6mm	tấn	0.31	45
K0016	M006	Thép tấm SS400 dày 10mm	tấn	0.15	46
K0016	M007	Thép tấm SS400 dày 16mm	tấn	0.23	47
K0016	M008	Thép hộp 100x100x4	tấn	0.31	48
K0017	M009	Thép hộp 150x150x5	tấn	0.15	49
K0017	M010	Ống thép D90x3.2	tấn	0.23	50
K0017	M011	Ống thép D114x4.0	tấn	0.31	51
K0018	M012	Bu lông neo M24x700	cái	0.15	52
K0018	M013	Bu lông cường độ cao M20x70	cái	0.23	53
K0018	M014	Bu lông cường độ cao M22x80	cái	0.31	54
K0019	M015	Que hàn E7018 phi 4.0	kg	0.15	55
K0019	M016	Dây hàn lõi thuốc E71T-1	kg	0.23	56
K0019	M017	Đá cắt inox 355mm	cái	0.31	57
K0020	M018	Sơn chống gỉ epoxy xám	thùng	0.15	58
K0020	M019	Sơn phủ polyurethane xanh	thùng	0.23	59
K0020	M020	Xà gồ C150x50x20x2.0	mét	0.31	60
K0021	M001	Thép hình H200x200x8x12	tấn	0.15	61
K0021	M002	Thép hình H300x300x10x15	tấn	0.23	62
K0021	M003	Thép I250x125x6x9	tấn	0.31	63
K0022	M004	Thép U200x75x8.5	tấn	0.15	64
K0022	M005	Thép tấm SS400 dày 6mm	tấn	0.23	65
K0022	M006	Thép tấm SS400 dày 10mm	tấn	0.31	66
K0023	M007	Thép tấm SS400 dày 16mm	tấn	0.15	67
K0023	M008	Thép hộp 100x100x4	tấn	0.23	68
K0023	M009	Thép hộp 150x150x5	tấn	0.31	69
K0024	M010	Ống thép D90x3.2	tấn	0.15	70
K0024	M011	Ống thép D114x4.0	tấn	0.23	71
K0024	M012	Bu lông neo M24x700	cái	0.31	72
K0025	M013	Bu lông cường độ cao M20x70	cái	0.15	73
K0025	M014	Bu lông cường độ cao M22x80	cái	0.23	74
K0025	M015	Que hàn E7018 phi 4.0	kg	0.31	75
K0026	M016	Dây hàn lõi thuốc E71T-1	kg	0.15	76
K0026	M017	Đá cắt inox 355mm	cái	0.23	77
K0026	M018	Sơn chống gỉ epoxy xám	thùng	0.31	78
K0027	M019	Sơn phủ polyurethane xanh	thùng	0.15	79
K0027	M020	Xà gồ C150x50x20x2.0	mét	0.23	80
K0027	M001	Thép hình H200x200x8x12	tấn	0.31	81
K0028	M002	Thép hình H300x300x10x15	tấn	0.15	82
K0028	M003	Thép I250x125x6x9	tấn	0.23	83
K0028	M004	Thép U200x75x8.5	tấn	0.31	84
K0029	M005	Thép tấm SS400 dày 6mm	tấn	0.15	85
K0029	M006	Thép tấm SS400 dày 10mm	tấn	0.23	86
K0029	M007	Thép tấm SS400 dày 16mm	tấn	0.31	87
K0030	M008	Thép hộp 100x100x4	tấn	0.15	88
K0030	M009	Thép hộp 150x150x5	tấn	0.23	89
K0030	M010	Ống thép D90x3.2	tấn	0.31	90
\.


--
-- Data for Name: structure_warehouse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.structure_warehouse (material_id, material_name, unit, qty, cost, note) FROM stdin;
M006	Thép tấm SS400 dày 10mm	tấn	11	24397967	
M001	Thép hình H200x200x8x12	tấn	12	26006473	
M010	Ống thép D90x3.2	tấn	9.455	25744612	
\.


--
-- Data for Name: structures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.structures (id, name, unit, qty, cost, note, type, zone, position_x, position_y, layer, rotation, length, width, height, weight, project_id) FROM stdin;
K0001	Cột biên CB-01	cái	10	8500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0002	Cột giữa CG-02	cái	12	9750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0003	Kèo chính KC-01	cái	14	11000000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0004	Kèo phụ KP-02	cái	16	12250000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0005	Dầm cầu trục DCT-01	cái	18	13500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0006	Xà gồ mái XGM-01	cái	25	14750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0007	Xà gồ vách XGV-01	cái	27	16000000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0008	Giằng mái GM-01	cái	29	17250000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0009	Giằng cột GC-01	cái	31	18500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0010	Dầm sàn DS-01	cái	6	19750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0011	Bản mã chân cột BMC-01	cái	13	8500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0012	Bản mã liên kết BMLK-01	cái	15	9750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0013	Lan can thép LC-01	cái	17	11000000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0014	Cầu thang thép CT-01	cái	19	12250000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0015	Khung cửa trời KCT-01	cái	21	13500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0016	Mái canopy MCP-01	cái	28	14750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0017	Khung đỡ thiết bị KDTB-01	cái	30	16000000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0018	Sàn thao tác STT-01	cái	32	17250000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0019	Dầm phụ DP-01	cái	7	18500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0020	Kèo đầu hồi KDH-01	cái	9	19750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0021	Cột hồi CH-01	cái	16	8500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0022	Giằng xà gồ GXG-01	cái	18	9750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0023	Thanh chống TC-01	cái	20	11000000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0024	Bệ đỡ máy BDM-01	cái	22	12250000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0025	Khung vách KV-01	cái	24	13500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0026	Máng xối thép MX-01	cái	31	14750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0027	Khung mái phụ KMP-01	cái	33	16000000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0028	Dầm treo DT-01	cái	8	17250000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0029	Bậc thang BT-01	cái	10	18500000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
K0030	Thanh neo TN-01	cái	12	19750000	Dữ liệu mẫu cấu kiện nhà thép	\N	\N	\N	\N	1	0	6	1.2	0.8	1200	\N
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, phone, email, address) FROM stdin;
S0001	Công ty Thép Hòa Phát Miền Nam	0910000000	ncc01@steeltrack.test	12 Đường công nghiệp 1, TP.HCM
S0002	Công ty CP Thép Nam Kim	0910217391	ncc02@steeltrack.test	13 Đường công nghiệp 2, TP.HCM
S0003	Công ty TNHH Thép Pomina	0910434782	ncc03@steeltrack.test	14 Đường công nghiệp 3, TP.HCM
S0004	Công ty Thép Việt Nhật	0910652173	ncc04@steeltrack.test	15 Đường công nghiệp 4, TP.HCM
S0005	Công ty TNHH Vật Tư Xây Dựng An Phát	0910869564	ncc05@steeltrack.test	16 Đường công nghiệp 5, TP.HCM
S0006	Công ty Thép Đại Thiên Lộc	0911086955	ncc06@steeltrack.test	17 Đường công nghiệp 6, TP.HCM
S0007	Công ty TNHH Thép Á Châu	0911304346	ncc07@steeltrack.test	18 Đường công nghiệp 7, TP.HCM
S0008	Công ty CP Kim Khí Sài Gòn	0911521737	ncc08@steeltrack.test	19 Đường công nghiệp 8, TP.HCM
S0009	Công ty TNHH Bulong Ốc Vít Thành Công	0911739128	ncc09@steeltrack.test	20 Đường công nghiệp 9, TP.HCM
S0010	Công ty TNHH Vật Tư Hàn Việt Đức	0911956519	ncc10@steeltrack.test	21 Đường công nghiệp 10, TP.HCM
S0011	Công ty Sơn Công Nghiệp KCC Việt Nam	0912173910	ncc11@steeltrack.test	22 Đường công nghiệp 11, TP.HCM
S0012	Công ty Sơn Jotun Việt Nam	0912391301	ncc12@steeltrack.test	23 Đường công nghiệp 12, TP.HCM
S0013	Công ty TNHH Thép Minh Phát	0912608692	ncc13@steeltrack.test	24 Đường công nghiệp 13, TP.HCM
S0014	Công ty TNHH Cơ Khí Vật Tư Tân Thành	0912826083	ncc14@steeltrack.test	25 Đường công nghiệp 14, TP.HCM
S0015	Công ty CP Thép Miền Tây	0913043474	ncc15@steeltrack.test	26 Đường công nghiệp 15, TP.HCM
S0016	Công ty TNHH Thương Mại Thép Đức Thành	0913260865	ncc16@steeltrack.test	27 Đường công nghiệp 16, TP.HCM
S0017	Công ty TNHH Thép Bình Dương	0913478256	ncc17@steeltrack.test	28 Đường công nghiệp 17, TP.HCM
S0018	Công ty TNHH Kim Khí Đông Á	0913695647	ncc18@steeltrack.test	29 Đường công nghiệp 18, TP.HCM
S0019	Công ty TNHH Vật Tư Cơ Khí Phú Gia	0913913038	ncc19@steeltrack.test	30 Đường công nghiệp 19, TP.HCM
S0020	Công ty CP Thép Việt Úc	0914130429	ncc20@steeltrack.test	31 Đường công nghiệp 20, TP.HCM
S0021	Công ty TNHH Sơn Hải Phòng CN Miền Nam	0914347820	ncc21@steeltrack.test	32 Đường công nghiệp 21, TP.HCM
S0022	Công ty TNHH Thiết Bị Hàn Nam Việt	0914565211	ncc22@steeltrack.test	33 Đường công nghiệp 22, TP.HCM
S0023	Công ty TNHH Vật Tư Công Nghiệp Hưng Thịnh	0914782602	ncc23@steeltrack.test	34 Đường công nghiệp 23, TP.HCM
S0024	Công ty TNHH Thép Hoàng Gia	0914999993	ncc24@steeltrack.test	35 Đường công nghiệp 24, TP.HCM
S0025	Công ty TNHH Kim Khí An Bình	0915217384	ncc25@steeltrack.test	36 Đường công nghiệp 25, TP.HCM
S0026	Công ty CP Cơ Điện Vật Tư Long Thành	0915434775	ncc26@steeltrack.test	37 Đường công nghiệp 26, TP.HCM
S0027	Công ty TNHH Thép Trường Phát	0915652166	ncc27@steeltrack.test	38 Đường công nghiệp 27, TP.HCM
S0028	Công ty TNHH Bulong Đại Nam	0915869557	ncc28@steeltrack.test	39 Đường công nghiệp 28, TP.HCM
S0029	Công ty TNHH Vật Tư Kết Cấu Việt	0916086948	ncc29@steeltrack.test	40 Đường công nghiệp 29, TP.HCM
S0030	Công ty TNHH Thép Gia Phát	0916304339	ncc30@steeltrack.test	41 Đường công nghiệp 30, TP.HCM
\.


--
-- Data for Name: sw_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sw_logs (id, material_id, material_name, qty, unit, cost, note, attachment, created_at, type) FROM stdin;
3	M006	Thép tấm SS400 dày 10mm	11	tấn	24397967	Chuyển sang kho CK	[]	2026-05-18 14:00:00	transfer_to_sw
4	M001	Thép hình H200x200x8x12	12	tấn	26006473	Chuyển sang kho CK	[]	2026-05-18 14:03:00	transfer_to_sw
5	M010	Ống thép D90x3.2	9.455	tấn	25744612	Chuyển sang kho CK	[]	2026-05-18 14:03:00	transfer_to_sw
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, mid, supplier_id, project_id, date, datetime, type, qty, unit_price, vat_rate, subtotal, vat_amount, total_amount, note, attachment, invoice_image) FROM stdin;
T0001	M007	S0014		2023-01-07	2023-01-07 08:00:00	purchase	13.173	24119687.00	10.0	317728636.85	31772863.69	349501500.54	Nhập theo chu kỳ dài Thép tấm SS400 dày 16mm tháng 1/2023	[]	
T0002	M012	S0017		2023-01-05	2023-01-05 11:00:00	purchase	4036.000	69427.00	8.0	280207372.00	22416589.76	302623961.76	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0003	M006	S0020		2023-01-05	2023-01-05 12:00:00	purchase	5.954	21620459.00	10.0	128728212.89	12872821.29	141601034.17	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0004	M005	S0023		2023-01-02	2023-01-02 14:00:00	purchase	9.798	21250840.00	10.0	208215730.32	20821573.03	229037303.35	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0005	M004	S0026		2023-01-04	2023-01-04 15:00:00	purchase	10.647	21354426.00	10.0	227360573.62	22736057.36	250096630.98	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0006	M008	S0029		2023-01-03	2023-01-03 11:00:00	purchase	9.069	24634474.00	10.0	223410044.71	22341004.47	245751049.18	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0007	M013	S0002		2023-01-08	2023-01-08 11:00:00	purchase	14856.000	19443.00	8.0	288845208.00	23107616.64	311952824.64	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0008	M009	S0005		2023-01-04	2023-01-04 09:00:00	purchase	11.751	24948172.00	8.0	293165969.17	23453277.53	316619246.71	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0009	M018	S0008		2023-01-03	2023-01-03 08:00:00	purchase	206.000	1503033.00	10.0	309624798.00	30962479.80	340587277.80	Nhập kế hoạch tuần đầu tháng 1/2023	[]	
T0010	M009		P0024	2023-01-02	2023-01-02 12:00:00	usage	2.952	25362043.00	0.0	74868750.94	0.00	74868750.94	Xuất tuần 1 cho Kho phân phối Bình Chánh	[]	
T0011	M008		P0025	2023-01-05	2023-01-05 16:00:00	usage	4.539	24758619.00	0.0	112379371.64	0.00	112379371.64	Xuất tuần 1 cho Nhà máy sơn Long Thành	[]	
T0012	M008		P0026	2023-01-05	2023-01-05 15:00:00	usage	2.572	24758619.00	0.0	63679168.07	0.00	63679168.07	Xuất tuần 1 cho Xưởng bao bì carton Cần Giuộc	[]	
T0013	M006		P0027	2023-01-02	2023-01-02 13:00:00	usage	3.334	22205115.00	0.0	74031853.41	0.00	74031853.41	Xuất tuần 1 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0014	M012		P0027	2023-01-11	2023-01-11 14:00:00	usage	904.000	68357.00	0.0	61794728.00	0.00	61794728.00	Xuất tuần 2 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0015	M007		P0028	2023-01-11	2023-01-11 09:00:00	usage	3.842	23354922.00	0.0	89729610.32	0.00	89729610.32	Xuất tuần 2 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0016	M018		P0029	2023-01-09	2023-01-09 17:00:00	usage	44.000	1485758.00	0.0	65373352.00	0.00	65373352.00	Xuất tuần 2 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0017	M012		P0030	2023-01-09	2023-01-09 09:00:00	usage	1075.000	68357.00	0.0	73483775.00	0.00	73483775.00	Xuất tuần 2 cho Trung tâm vận hành Đức Trọng	[]	
T0018	M013		P0030	2023-01-16	2023-01-16 12:00:00	usage	6775.000	18736.00	0.0	126936400.00	0.00	126936400.00	Xuất tuần 3 cho Trung tâm vận hành Đức Trọng	[]	
T0019	M006		P0031	2023-01-19	2023-01-19 16:00:00	usage	2.620	22205115.00	0.0	58177401.30	0.00	58177401.30	Xuất tuần 3 cho Nhà máy phân bón Long An	[]	
T0020	M006	S0025		2023-01-27	2023-01-27 14:00:00	purchase	19.901	24292263.00	10.0	483440325.96	48344032.60	531784358.56	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 10mm	[]	
T0021	M006		P0031	2023-01-29	2023-01-29 15:00:00	usage	0.924	22831259.00	0.0	21096083.32	0.00	21096083.32	Xuất tiếp sau nhập bù cho Nhà máy phân bón Long An	[]	
T0022	M007		P0032	2023-01-16	2023-01-16 16:00:00	usage	2.486	23354922.00	0.0	58060336.09	0.00	58060336.09	Xuất tuần 3 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0023	M005		P0033	2023-01-23	2023-01-23 12:00:00	usage	3.061	21662710.00	0.0	66309555.31	0.00	66309555.31	Xuất tuần 4 cho Nhà xưởng sản xuất pallet	[]	
T0024	M009		P0034	2023-01-27	2023-01-27 10:00:00	usage	2.858	25362043.00	0.0	72484718.89	0.00	72484718.89	Xuất tuần 4 cho Nhà máy nông sản Cái Bè	[]	
T0025	M018		P0035	2023-01-23	2023-01-23 14:00:00	usage	43.000	1485758.00	0.0	63887594.00	0.00	63887594.00	Xuất tuần 4 cho Xưởng gia công thép Thủ Đức	[]	
T0026	M007		P0036	2023-01-28	2023-01-28 16:00:00	usage	3.100	23354922.00	0.0	72400258.20	0.00	72400258.20	Xuất tuần 4 cho Kho ngoại quan Hiệp Phước	[]	
T0027	M018		P0024	2023-01-28	2023-01-28 15:00:00	return	9.000	1485758.00	0.0	13371822.00	0.00	13371822.00	Trả vật tư dư cuối tháng từ Kho phân phối Bình Chánh	[]	
T0028	M019	S0003		2023-02-05	2023-02-05 10:00:00	purchase	193.000	1803471.00	10.0	348069903.00	34806990.30	382876893.30	Nhập theo chu kỳ dài Sơn phủ polyurethane xanh tháng 2/2023	[]	
T0029	M013	S0012		2023-02-04	2023-02-04 15:00:00	purchase	14099.000	18773.00	10.0	264680527.00	26468052.70	291148579.70	Nhập kế hoạch tuần đầu tháng 2/2023	[]	
T0030	M005	S0027		2023-02-03	2023-02-03 13:00:00	purchase	14.219	22946139.00	8.0	326271150.44	26101692.04	352372842.48	Nhập kế hoạch tuần đầu tháng 2/2023	[]	
T0031	M006		P0029	2023-02-04	2023-02-04 15:00:00	usage	3.087	22831259.00	0.0	70480096.53	0.00	70480096.53	Xuất tuần 1 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0032	M007		P0030	2023-02-04	2023-02-04 15:00:00	usage	2.200	23354922.00	0.0	51380828.40	0.00	51380828.40	Xuất tuần 1 cho Trung tâm vận hành Đức Trọng	[]	
T0033	M015	S0027		2023-02-11	2023-02-11 11:00:00	purchase	4764.000	40572.00	10.0	193285008.00	19328500.80	212613508.80	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0034	M015		P0031	2023-02-12	2023-02-12 10:00:00	usage	1774.000	41572.00	0.0	73748728.00	0.00	73748728.00	Xuất tiếp sau nhập bù cho Nhà máy phân bón Long An	[]	
T0035	M019		P0032	2023-02-05	2023-02-05 13:00:00	usage	49.000	1740868.00	0.0	85302532.00	0.00	85302532.00	Xuất tuần 1 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0036	M005		P0033	2023-02-05	2023-02-05 15:00:00	usage	2.276	21983567.00	0.0	50034598.49	0.00	50034598.49	Xuất tuần 1 cho Nhà xưởng sản xuất pallet	[]	
T0037	M002	S0030		2023-02-18	2023-02-18 10:00:00	purchase	9.519	24622398.00	10.0	234380606.56	23438060.66	257818667.22	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0038	M002		P0032	2023-02-19	2023-02-19 12:00:00	usage	3.764	24606719.00	0.0	92619690.32	0.00	92619690.32	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0039	M015		P0033	2023-02-13	2023-02-13 11:00:00	usage	2620.000	41572.00	0.0	108918640.00	0.00	108918640.00	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T0040	M001	S0002		2023-02-12	2023-02-12 13:00:00	purchase	18.333	25185823.00	10.0	461731693.06	46173169.31	507904862.36	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T0041	M001		P0034	2023-02-14	2023-02-14 10:00:00	usage	3.856	24215747.00	0.0	93375920.43	0.00	93375920.43	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T0042	M011	S0005		2023-02-25	2023-02-25 12:00:00	purchase	11.387	25633702.00	10.0	291890964.67	29189096.47	321080061.14	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0043	M011		P0035	2023-02-27	2023-02-27 10:00:00	usage	2.302	25120111.00	0.0	57826495.52	0.00	57826495.52	Xuất tiếp sau nhập bù cho Xưởng gia công thép Thủ Đức	[]	
T0044	M018		P0036	2023-02-21	2023-02-21 12:00:00	usage	50.000	1485758.00	0.0	74287900.00	0.00	74287900.00	Xuất tuần 3 cho Kho ngoại quan Hiệp Phước	[]	
T0045	M015		P0037	2023-02-20	2023-02-20 11:00:00	usage	370.000	41572.00	0.0	15381640.00	0.00	15381640.00	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T0046	M015	S0007		2023-02-28	2023-02-28 13:00:00	purchase	2177.000	44511.00	10.0	96900447.00	9690044.70	106590491.70	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0047	M015		P0037	2023-02-28	2023-02-28 13:00:00	usage	888.000	42454.00	0.0	37699152.00	0.00	37699152.00	Xuất tiếp sau nhập bù cho Nhà máy điện mặt trời phụ trợ	[]	
T0048	M006		P0038	2023-02-20	2023-02-20 17:00:00	usage	3.215	22831259.00	0.0	73402497.69	0.00	73402497.69	Xuất tuần 3 cho Trung tâm bảo trì thiết bị	[]	
T0049	M011		P0038	2023-02-23	2023-02-23 17:00:00	usage	4.220	25120111.00	0.0	106006868.42	0.00	106006868.42	Xuất tuần 4 cho Trung tâm bảo trì thiết bị	[]	
T0050	M002		P0039	2023-02-24	2023-02-24 11:00:00	usage	3.915	24606719.00	0.0	96335304.89	0.00	96335304.89	Xuất tuần 4 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0051	M005		P0040	2023-02-28	2023-02-28 16:00:00	usage	4.743	21983567.00	0.0	104268058.28	0.00	104268058.28	Xuất tuần 4 cho Xưởng sản xuất container module	[]	
T0052	M019		P0001	2023-02-28	2023-02-28 16:00:00	usage	51.000	1740868.00	0.0	88784268.00	0.00	88784268.00	Xuất tuần 4 cho Nhà xưởng Sunrise Long An	[]	
T0053	M004		P0029	2023-02-22	2023-02-22 15:00:00	return	2.129	22288607.00	0.0	47452444.30	0.00	47452444.30	Trả vật tư dư cuối tháng từ Nhà xưởng phụ trợ Dĩ An	[]	
T0054	M004	S0001		2023-03-02	2023-03-02 08:00:00	purchase	14.057	23650280.00	10.0	332451985.96	33245198.60	365697184.56	Nhập kế hoạch tuần đầu tháng 3/2023	[]	
T0055	M006	S0004		2023-03-03	2023-03-03 14:00:00	purchase	11.181	24652611.00	8.0	275640843.59	22051267.49	297692111.08	Nhập kế hoạch tuần đầu tháng 3/2023	[]	
T0056	M012	S0010		2023-03-04	2023-03-04 08:00:00	purchase	7047.000	69011.00	10.0	486320517.00	48632051.70	534952568.70	Nhập kế hoạch tuần đầu tháng 3/2023	[]	
T0057	M008	S0013		2023-03-02	2023-03-02 10:00:00	purchase	15.690	23623082.00	8.0	370646156.58	29651692.53	400297849.11	Nhập kế hoạch tuần đầu tháng 3/2023	[]	
T0058	M005	S0019		2023-03-01	2023-03-01 14:00:00	purchase	28.466	22841583.00	10.0	650208501.68	65020850.17	715229351.85	Nhập kế hoạch tuần đầu tháng 3/2023	[]	
T0059	M015	S0004		2023-03-03	2023-03-03 14:00:00	purchase	8124.000	45070.00	10.0	366148680.00	36614868.00	402763548.00	Nhập kế hoạch tuần đầu tháng 3/2023	[]	
T0060	M016	S0006		2023-03-11	2023-03-11 12:00:00	purchase	6023.000	54932.00	10.0	330855436.00	33085543.60	363940979.60	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0061	M016		P0034	2023-03-12	2023-03-12 16:00:00	usage	1831.000	52880.00	0.0	96823280.00	0.00	96823280.00	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T0062	M010	S0007		2023-03-08	2023-03-08 08:00:00	purchase	9.605	24522954.00	10.0	235542973.17	23554297.32	259097270.49	Nhập bù sau khi gần cạn tồn Ống thép D90x3.2	[]	
T0063	M010		P0035	2023-03-09	2023-03-09 14:00:00	usage	4.421	24296886.00	0.0	107416533.01	0.00	107416533.01	Xuất tiếp sau nhập bù cho Xưởng gia công thép Thủ Đức	[]	
T0064	M004		P0036	2023-03-04	2023-03-04 16:00:00	usage	9.964	22629025.00	0.0	225475605.10	0.00	225475605.10	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T0065	M012		P0037	2023-03-07	2023-03-07 13:00:00	usage	2892.000	68521.00	0.0	198162732.00	0.00	198162732.00	Xuất tuần 1 cho Nhà máy điện mặt trời phụ trợ	[]	
T0066	M016		P0037	2023-03-14	2023-03-14 11:00:00	usage	2639.000	52880.00	0.0	139550320.00	0.00	139550320.00	Xuất tuần 2 cho Nhà máy điện mặt trời phụ trợ	[]	
T0067	M002		P0038	2023-03-14	2023-03-14 11:00:00	usage	1.840	24606719.00	0.0	45276362.96	0.00	45276362.96	Xuất tuần 2 cho Trung tâm bảo trì thiết bị	[]	
T0068	M002	S0012		2023-03-19	2023-03-19 09:00:00	purchase	10.064	27364238.00	10.0	275393691.23	27539369.12	302933060.36	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0069	M002		P0038	2023-03-20	2023-03-20 14:00:00	usage	1.598	25433975.00	0.0	40643492.05	0.00	40643492.05	Xuất tiếp sau nhập bù cho Trung tâm bảo trì thiết bị	[]	
T0070	M006		P0039	2023-03-10	2023-03-10 14:00:00	usage	6.827	23286597.00	0.0	158977597.72	0.00	158977597.72	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0071	M001		P0040	2023-03-14	2023-03-14 14:00:00	usage	7.565	24215747.00	0.0	183192126.06	0.00	183192126.06	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T0072	M016		P0040	2023-03-17	2023-03-17 12:00:00	usage	1553.000	52880.00	0.0	82122640.00	0.00	82122640.00	Xuất tuần 3 cho Xưởng sản xuất container module	[]	
T0073	M016	S0016		2023-03-21	2023-03-21 12:00:00	purchase	2534.000	53133.00	10.0	134639022.00	13463902.20	148102924.20	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0074	M016		P0040	2023-03-22	2023-03-22 16:00:00	usage	981.000	52956.00	0.0	51949836.00	0.00	51949836.00	Xuất tiếp sau nhập bù cho Xưởng sản xuất container module	[]	
T0075	M010		P0001	2023-03-18	2023-03-18 09:00:00	usage	5.184	24296886.00	0.0	125955057.02	0.00	125955057.02	Xuất tuần 3 cho Nhà xưởng Sunrise Long An	[]	
T0076	M010	S0017		2023-03-20	2023-03-20 13:00:00	purchase	16.126	24934472.00	10.0	402093295.47	40209329.55	442302625.02	Nhập bù sau khi gần cạn tồn Ống thép D90x3.2	[]	
T0077	M010		P0001	2023-03-22	2023-03-22 12:00:00	usage	3.437	24488162.00	0.0	84165812.79	0.00	84165812.79	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T0078	M008		P0002	2023-03-16	2023-03-16 11:00:00	usage	7.356	24474735.00	0.0	180036150.66	0.00	180036150.66	Xuất tuần 3 cho Kho lạnh Mekong Logistics	[]	
T0079	M015		P0003	2023-03-26	2023-03-26 11:00:00	usage	3431.000	43108.00	0.0	147903548.00	0.00	147903548.00	Xuất tuần 4 cho Nhà máy bao bì Tân Phú	[]	
T0080	M012		P0004	2023-03-24	2023-03-24 14:00:00	usage	1311.000	68521.00	0.0	89831031.00	0.00	89831031.00	Xuất tuần 4 cho Xưởng cơ khí Bình Dương	[]	
T0081	M016		P0005	2023-03-24	2023-03-24 17:00:00	usage	1553.000	52956.00	0.0	82240668.00	0.00	82240668.00	Xuất tuần 4 cho Trung tâm phân phối An Sương	[]	
T0082	M016	S0023		2023-03-29	2023-03-29 08:00:00	purchase	2444.000	51839.00	10.0	126694516.00	12669451.60	139363967.60	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0083	M016		P0005	2023-03-31	2023-03-31 13:00:00	usage	728.000	52621.00	0.0	38308088.00	0.00	38308088.00	Xuất tiếp sau nhập bù cho Trung tâm phân phối An Sương	[]	
T0084	M005		P0006	2023-03-27	2023-03-27 13:00:00	usage	6.380	22198071.00	0.0	141623692.98	0.00	141623692.98	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T0085	M008		P0007	2023-03-26	2023-03-26 17:00:00	usage	4.808	24474735.00	0.0	117674525.88	0.00	117674525.88	Xuất tuần 4 cho Kho thép Phú Mỹ	[]	
T0086	M015		P0008	2023-03-25	2023-03-25 17:00:00	usage	3312.000	43108.00	0.0	142773696.00	0.00	142773696.00	Xuất tuần 4 cho Nhà xưởng may Phước Đông	[]	
T0087	M001	S0005		2023-04-05	2023-04-05 09:00:00	purchase	16.769	24492912.00	10.0	410721641.33	41072164.13	451793805.46	Nhập kế hoạch tuần đầu tháng 4/2023	[]	
T0088	M020	S0011		2023-04-04	2023-04-04 12:00:00	purchase	2814.000	114833.00	10.0	323140062.00	32314006.20	355454068.20	Nhập kế hoạch tuần đầu tháng 4/2023	[]	
T0089	M009	S0017		2023-04-04	2023-04-04 09:00:00	purchase	14.760	24410518.00	8.0	360299245.68	28823939.65	389123185.33	Nhập kế hoạch tuần đầu tháng 4/2023	[]	
T0090	M018	S0029		2023-04-02	2023-04-02 13:00:00	purchase	227.000	1596817.00	8.0	362477459.00	28998196.72	391475655.72	Nhập kế hoạch tuần đầu tháng 4/2023	[]	
T0091	M019		P0039	2023-04-05	2023-04-05 14:00:00	usage	60.000	1740868.00	0.0	104452080.00	0.00	104452080.00	Xuất tuần 1 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0092	M015		P0040	2023-04-04	2023-04-04 11:00:00	usage	2218.000	43108.00	0.0	95613544.00	0.00	95613544.00	Xuất tuần 1 cho Xưởng sản xuất container module	[]	
T0093	M004		P0001	2023-04-04	2023-04-04 10:00:00	usage	5.098	22629025.00	0.0	115362769.45	0.00	115362769.45	Xuất tuần 1 cho Nhà xưởng Sunrise Long An	[]	
T0094	M001		P0002	2023-04-05	2023-04-05 17:00:00	usage	7.494	24285038.00	0.0	181992074.77	0.00	181992074.77	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T0095	M019		P0003	2023-04-06	2023-04-06 09:00:00	usage	33.000	1740868.00	0.0	57448644.00	0.00	57448644.00	Xuất tuần 1 cho Nhà máy bao bì Tân Phú	[]	
T0096	M019	S0021		2023-04-08	2023-04-08 10:00:00	purchase	32.000	1918452.00	10.0	61390464.00	6139046.40	67529510.40	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0097	M019		P0003	2023-04-09	2023-04-09 16:00:00	usage	17.000	1794143.00	0.0	30500431.00	0.00	30500431.00	Xuất tiếp sau nhập bù cho Nhà máy bao bì Tân Phú	[]	
T0098	M011		P0002	2023-04-11	2023-04-11 10:00:00	usage	2.624	25120111.00	0.0	65915171.26	0.00	65915171.26	Xuất tuần 2 cho Kho lạnh Mekong Logistics	[]	
T0099	M005		P0003	2023-04-12	2023-04-12 12:00:00	usage	3.330	22198071.00	0.0	73919576.43	0.00	73919576.43	Xuất tuần 2 cho Nhà máy bao bì Tân Phú	[]	
T0100	M002		P0004	2023-04-12	2023-04-12 13:00:00	usage	3.576	25433975.00	0.0	90951894.60	0.00	90951894.60	Xuất tuần 2 cho Xưởng cơ khí Bình Dương	[]	
T0101	M002		P0005	2023-04-09	2023-04-09 14:00:00	usage	4.072	25433975.00	0.0	103567146.20	0.00	103567146.20	Xuất tuần 2 cho Trung tâm phân phối An Sương	[]	
T0102	M015		P0006	2023-04-09	2023-04-09 11:00:00	usage	452.000	43108.00	0.0	19484816.00	0.00	19484816.00	Xuất tuần 2 cho Nhà máy thực phẩm GreenFarm	[]	
T0103	M015	S0026		2023-04-14	2023-04-14 09:00:00	purchase	3563.000	46447.00	10.0	165490661.00	16549066.10	182039727.10	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0104	M015		P0006	2023-04-16	2023-04-16 14:00:00	usage	1559.000	44110.00	0.0	68767490.00	0.00	68767490.00	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T0105	M015		P0007	2023-04-11	2023-04-11 10:00:00	usage	1255.000	44110.00	0.0	55358050.00	0.00	55358050.00	Xuất tuần 2 cho Kho thép Phú Mỹ	[]	
T0106	M020		P0005	2023-04-19	2023-04-19 10:00:00	usage	2470.000	117208.00	0.0	289503760.00	0.00	289503760.00	Xuất tuần 3 cho Trung tâm phân phối An Sương	[]	
T0107	M011		P0006	2023-04-21	2023-04-21 14:00:00	usage	2.241	25120111.00	0.0	56294168.75	0.00	56294168.75	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T0108	M011	S0028		2023-04-23	2023-04-23 10:00:00	purchase	17.481	25587619.00	10.0	447297167.74	44729716.77	492026884.51	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0109	M011		P0006	2023-04-24	2023-04-24 10:00:00	usage	5.610	25260363.00	0.0	141710636.43	0.00	141710636.43	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T0110	M004		P0007	2023-04-17	2023-04-17 14:00:00	usage	5.903	22629025.00	0.0	133579134.57	0.00	133579134.57	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T0111	M018		P0008	2023-04-27	2023-04-27 09:00:00	usage	124.000	1513523.00	0.0	187676852.00	0.00	187676852.00	Xuất tuần 4 cho Nhà xưởng may Phước Đông	[]	
T0112	M009		P0009	2023-04-23	2023-04-23 15:00:00	usage	4.812	25124162.00	0.0	120897467.54	0.00	120897467.54	Xuất tuần 4 cho Nhà máy nhựa Nam Việt	[]	
T0113	M005		P0010	2023-04-25	2023-04-25 16:00:00	usage	7.333	22198071.00	0.0	162778454.64	0.00	162778454.64	Xuất tuần 4 cho Khu bảo trì xe buýt Củ Chi	[]	
T0114	M018		P0011	2023-04-23	2023-04-23 09:00:00	usage	103.000	1513523.00	0.0	155892869.00	0.00	155892869.00	Xuất tuần 4 cho Nhà máy gỗ Đức Hòa	[]	
T0115	M009		P0012	2023-04-25	2023-04-25 11:00:00	usage	7.351	25124162.00	0.0	184687714.86	0.00	184687714.86	Xuất tuần 4 cho Kho tổng hợp Sóng Thần	[]	
T0116	M020		P0013	2023-04-25	2023-04-25 13:00:00	usage	344.000	117208.00	0.0	40319552.00	0.00	40319552.00	Xuất tuần 4 cho Nhà xưởng điện tử VSIP	[]	
T0117	M020	S0007		2023-04-29	2023-04-29 12:00:00	purchase	1629.000	117347.00	10.0	191158263.00	19115826.30	210274089.30	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T0118	M020		P0013	2023-04-30	2023-04-30 11:00:00	usage	691.000	117250.00	0.0	81019750.00	0.00	81019750.00	Xuất tiếp sau nhập bù cho Nhà xưởng điện tử VSIP	[]	
T0119	M002		P0039	2023-04-27	2023-04-27 15:00:00	return	0.164	25433975.00	0.0	4171171.90	0.00	4171171.90	Trả vật tư dư cuối tháng từ Nhà máy chế biến gạo Sa Đéc	[]	
T0120	M008	S0021		2023-05-08	2023-05-08 08:00:00	purchase	8.442	26272412.00	10.0	221791702.10	22179170.21	243970872.31	Nhập kế hoạch tuần đầu tháng 5/2023	[]	
T0121	M006	S0009		2023-05-06	2023-05-06 10:00:00	purchase	18.929	22211995.00	8.0	420450853.35	33636068.27	454086921.62	Nhập kế hoạch tuần đầu tháng 5/2023	[]	
T0122	M008		P0004	2023-05-05	2023-05-05 16:00:00	usage	9.864	24924154.00	0.0	245851855.06	0.00	245851855.06	Xuất tuần 1 cho Xưởng cơ khí Bình Dương	[]	
T0123	M006		P0005	2023-05-02	2023-05-02 09:00:00	usage	11.108	23017947.00	0.0	255683355.28	0.00	255683355.28	Xuất tuần 1 cho Trung tâm phân phối An Sương	[]	
T0124	M015		P0006	2023-05-04	2023-05-04 12:00:00	usage	749.000	44110.00	0.0	33038390.00	0.00	33038390.00	Xuất tuần 1 cho Nhà máy thực phẩm GreenFarm	[]	
T0125	M015	S0030		2023-05-13	2023-05-13 08:00:00	purchase	6666.000	49290.00	10.0	328567140.00	32856714.00	361423854.00	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0126	M015		P0006	2023-05-14	2023-05-14 09:00:00	usage	2569.000	45664.00	0.0	117310816.00	0.00	117310816.00	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T0127	M016		P0007	2023-05-13	2023-05-13 17:00:00	usage	1716.000	52621.00	0.0	90297636.00	0.00	90297636.00	Xuất tuần 2 cho Kho thép Phú Mỹ	[]	
T0128	M016	S0003		2023-05-21	2023-05-21 08:00:00	purchase	708.000	51541.00	10.0	36491028.00	3649102.80	40140130.80	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0129	M016		P0007	2023-05-22	2023-05-22 14:00:00	usage	152.000	52297.00	0.0	7949144.00	0.00	7949144.00	Xuất tiếp sau nhập bù cho Kho thép Phú Mỹ	[]	
T0130	M003	S0004		2023-05-17	2023-05-17 08:00:00	purchase	17.976	22632665.00	10.0	406844786.04	40684478.60	447529264.64	Nhập bù sau khi gần cạn tồn Thép I250x125x6x9	[]	
T0131	M003		P0008	2023-05-19	2023-05-19 10:00:00	usage	3.999	23029800.00	0.0	92096170.20	0.00	92096170.20	Xuất tiếp sau nhập bù cho Nhà xưởng may Phước Đông	[]	
T0132	M011		P0009	2023-05-12	2023-05-12 14:00:00	usage	4.243	25260363.00	0.0	107179720.21	0.00	107179720.21	Xuất tuần 2 cho Nhà máy nhựa Nam Việt	[]	
T0133	M006		P0010	2023-05-12	2023-05-12 12:00:00	usage	5.646	23017947.00	0.0	129959328.76	0.00	129959328.76	Xuất tuần 2 cho Khu bảo trì xe buýt Củ Chi	[]	
T0134	M015		P0011	2023-05-10	2023-05-10 15:00:00	usage	3974.000	45664.00	0.0	181468736.00	0.00	181468736.00	Xuất tuần 2 cho Nhà máy gỗ Đức Hòa	[]	
T0135	M011		P0010	2023-05-20	2023-05-20 16:00:00	usage	6.369	25260363.00	0.0	160883251.95	0.00	160883251.95	Xuất tuần 3 cho Khu bảo trì xe buýt Củ Chi	[]	
T0136	M016		P0011	2023-05-19	2023-05-19 17:00:00	usage	556.000	52297.00	0.0	29077132.00	0.00	29077132.00	Xuất tuần 3 cho Nhà máy gỗ Đức Hòa	[]	
T0137	M016	S0009		2023-05-25	2023-05-25 13:00:00	purchase	2976.000	51737.00	10.0	153969312.00	15396931.20	169366243.20	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0138	M016		P0011	2023-05-27	2023-05-27 17:00:00	usage	1715.000	52129.00	0.0	89401235.00	0.00	89401235.00	Xuất tiếp sau nhập bù cho Nhà máy gỗ Đức Hòa	[]	
T0139	M011		P0012	2023-05-18	2023-05-18 17:00:00	usage	1.259	25260363.00	0.0	31802797.02	0.00	31802797.02	Xuất tuần 3 cho Kho tổng hợp Sóng Thần	[]	
T0140	M011	S0010		2023-05-23	2023-05-23 13:00:00	purchase	7.678	25268614.00	10.0	194012418.29	19401241.83	213413660.12	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0141	M011		P0012	2023-05-25	2023-05-25 16:00:00	usage	3.181	25262838.00	0.0	80361087.68	0.00	80361087.68	Xuất tiếp sau nhập bù cho Kho tổng hợp Sóng Thần	[]	
T0142	M018		P0013	2023-05-26	2023-05-26 12:00:00	usage	78.000	1513523.00	0.0	118054794.00	0.00	118054794.00	Xuất tuần 4 cho Nhà xưởng điện tử VSIP	[]	
T0143	M018	S0013		2023-05-31	2023-05-31 13:00:00	purchase	61.000	1496467.00	10.0	91284487.00	9128448.70	100412935.70	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0144	M018		P0013	2023-05-31	2023-05-31 14:00:00	usage	16.000	1508406.00	0.0	24134496.00	0.00	24134496.00	Xuất tiếp sau nhập bù cho Nhà xưởng điện tử VSIP	[]	
T0145	M015		P0014	2023-05-23	2023-05-23 16:00:00	usage	123.000	45664.00	0.0	5616672.00	0.00	5616672.00	Xuất tuần 4 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0146	M015	S0014		2023-05-30	2023-05-30 11:00:00	purchase	4751.000	50993.00	10.0	242267743.00	24226774.30	266494517.30	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0147	M015		P0014	2023-05-31	2023-05-31 15:00:00	usage	1424.000	47263.00	0.0	67302512.00	0.00	67302512.00	Xuất tiếp sau nhập bù cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0148	M008		P0015	2023-05-26	2023-05-26 13:00:00	usage	2.808	24924154.00	0.0	69987024.43	0.00	69987024.43	Xuất tuần 4 cho Kho hàng cảng Cát Lái	[]	
T0149	M006		P0016	2023-05-23	2023-05-23 10:00:00	usage	3.024	23017947.00	0.0	69606271.73	0.00	69606271.73	Xuất tuần 4 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0150	M015		P0017	2023-05-23	2023-05-23 12:00:00	usage	1303.000	47263.00	0.0	61583689.00	0.00	61583689.00	Xuất tuần 4 cho Nhà máy dược phẩm Tân Uyên	[]	
T0151	M011		P0018	2023-05-24	2023-05-24 15:00:00	usage	4.497	25262838.00	0.0	113606982.49	0.00	113606982.49	Xuất tuần 4 cho Trạm logistics Nhơn Trạch	[]	
T0152	M011	S0018		2023-05-27	2023-05-27 14:00:00	purchase	8.254	27788213.00	10.0	229363910.10	22936391.01	252300301.11	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0153	M011		P0018	2023-05-28	2023-05-28 15:00:00	usage	0.551	26020450.00	0.0	14337267.95	0.00	14337267.95	Xuất tiếp sau nhập bù cho Trạm logistics Nhơn Trạch	[]	
T0154	M019	S0007		2023-06-03	2023-06-03 13:00:00	purchase	309.000	1814319.00	8.0	560624571.00	44849965.68	605474536.68	Nhập theo chu kỳ dài Sơn phủ polyurethane xanh tháng 6/2023	[]	
T0155	M006	S0010		2023-06-03	2023-06-03 10:00:00	purchase	34.351	21642734.00	10.0	743449555.63	74344955.56	817794511.20	Nhập kế hoạch tuần đầu tháng 6/2023	[]	
T0156	M005	S0013		2023-06-07	2023-06-07 14:00:00	purchase	34.020	23629127.00	10.0	803862900.54	80386290.05	884249190.59	Nhập kế hoạch tuần đầu tháng 6/2023	[]	
T0157	M005		P0009	2023-06-04	2023-06-04 12:00:00	usage	5.181	22555835.00	0.0	116861781.14	0.00	116861781.14	Xuất tuần 1 cho Nhà máy nhựa Nam Việt	[]	
T0158	M009		P0010	2023-06-05	2023-06-05 09:00:00	usage	8.538	25124162.00	0.0	214510095.16	0.00	214510095.16	Xuất tuần 1 cho Khu bảo trì xe buýt Củ Chi	[]	
T0159	M009	S0010		2023-06-12	2023-06-12 11:00:00	purchase	5.818	26274689.00	10.0	152866140.60	15286614.06	168152754.66	Nhập bù sau khi gần cạn tồn Thép hộp 150x150x5	[]	
T0160	M009		P0010	2023-06-14	2023-06-14 17:00:00	usage	1.894	25469320.00	0.0	48238892.08	0.00	48238892.08	Xuất tiếp sau nhập bù cho Khu bảo trì xe buýt Củ Chi	[]	
T0161	M013		P0011	2023-06-03	2023-06-03 17:00:00	usage	9367.000	18745.00	0.0	175584415.00	0.00	175584415.00	Xuất tuần 1 cho Nhà máy gỗ Đức Hòa	[]	
T0162	M008		P0012	2023-06-02	2023-06-02 14:00:00	usage	1.254	24924154.00	0.0	31254889.12	0.00	31254889.12	Xuất tuần 1 cho Kho tổng hợp Sóng Thần	[]	
T0163	M008	S0012		2023-06-06	2023-06-06 12:00:00	purchase	29.840	26117541.00	10.0	779347423.44	77934742.34	857282165.78	Nhập bù sau khi gần cạn tồn Thép hộp 100x100x4	[]	
T0164	M008		P0012	2023-06-09	2023-06-09 14:00:00	usage	6.220	25282170.00	0.0	157255097.40	0.00	157255097.40	Xuất tiếp sau nhập bù cho Kho tổng hợp Sóng Thần	[]	
T0165	M005		P0013	2023-06-05	2023-06-05 15:00:00	usage	7.571	22555835.00	0.0	170770226.79	0.00	170770226.79	Xuất tuần 1 cho Nhà xưởng điện tử VSIP	[]	
T0166	M005		P0012	2023-06-12	2023-06-12 10:00:00	usage	7.958	22555835.00	0.0	179499334.93	0.00	179499334.93	Xuất tuần 2 cho Kho tổng hợp Sóng Thần	[]	
T0167	M005		P0013	2023-06-10	2023-06-10 15:00:00	usage	6.227	22555835.00	0.0	140455184.55	0.00	140455184.55	Xuất tuần 2 cho Nhà xưởng điện tử VSIP	[]	
T0168	M013		P0014	2023-06-12	2023-06-12 13:00:00	usage	11103.000	18745.00	0.0	208125735.00	0.00	208125735.00	Xuất tuần 2 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0169	M001		P0015	2023-06-13	2023-06-13 13:00:00	usage	8.838	24285038.00	0.0	214631165.84	0.00	214631165.84	Xuất tuần 2 cho Kho hàng cảng Cát Lái	[]	
T0170	M002		P0016	2023-06-14	2023-06-14 16:00:00	usage	0.982	25433975.00	0.0	24976163.45	0.00	24976163.45	Xuất tuần 2 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0171	M002	S0018		2023-06-16	2023-06-16 13:00:00	purchase	31.457	24632189.00	10.0	774854769.37	77485476.94	852340246.31	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0172	M002		P0016	2023-06-19	2023-06-19 12:00:00	usage	8.915	25193439.00	0.0	224599508.68	0.00	224599508.68	Xuất tiếp sau nhập bù cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0173	M005		P0015	2023-06-16	2023-06-16 15:00:00	usage	10.921	22555835.00	0.0	246332274.04	0.00	246332274.04	Xuất tuần 3 cho Kho hàng cảng Cát Lái	[]	
T0174	M009		P0016	2023-06-17	2023-06-17 11:00:00	usage	3.924	25469320.00	0.0	99941611.68	0.00	99941611.68	Xuất tuần 3 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0175	M009	S0020		2023-06-21	2023-06-21 13:00:00	purchase	8.917	25462744.00	10.0	227051288.25	22705128.82	249756417.07	Nhập bù sau khi gần cạn tồn Thép hộp 150x150x5	[]	
T0176	M009		P0016	2023-06-22	2023-06-22 12:00:00	usage	2.471	25467347.00	0.0	62929814.44	0.00	62929814.44	Xuất tiếp sau nhập bù cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0177	M011		P0017	2023-06-16	2023-06-16 12:00:00	usage	7.703	26020450.00	0.0	200435526.35	0.00	200435526.35	Xuất tuần 3 cho Nhà máy dược phẩm Tân Uyên	[]	
T0178	M011	S0021		2023-06-23	2023-06-23 11:00:00	purchase	10.585	27375693.00	10.0	289771710.41	28977171.04	318748881.45	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0179	M011		P0017	2023-06-26	2023-06-26 14:00:00	usage	2.867	26427023.00	0.0	75766274.94	0.00	75766274.94	Xuất tiếp sau nhập bù cho Nhà máy dược phẩm Tân Uyên	[]	
T0180	M009		P0018	2023-06-23	2023-06-23 14:00:00	usage	6.446	25467347.00	0.0	164162518.76	0.00	164162518.76	Xuất tuần 4 cho Trạm logistics Nhơn Trạch	[]	
T0181	M009	S0024		2023-06-30	2023-06-30 08:00:00	purchase	7.087	25777313.00	10.0	182683817.23	18268381.72	200952198.95	Nhập bù sau khi gần cạn tồn Thép hộp 150x150x5	[]	
T0182	M009		P0018	2023-06-30	2023-06-30 10:00:00	usage	1.207	25560337.00	0.0	30851326.76	0.00	30851326.76	Xuất tiếp sau nhập bù cho Trạm logistics Nhơn Trạch	[]	
T0183	M019		P0019	2023-06-25	2023-06-25 10:00:00	usage	138.000	1799187.00	0.0	248287806.00	0.00	248287806.00	Xuất tuần 4 cho Nhà xưởng cơ điện Quận 12	[]	
T0184	M006		P0020	2023-06-23	2023-06-23 11:00:00	usage	4.632	22674144.00	0.0	105026635.01	0.00	105026635.01	Xuất tuần 4 cho Kho nguyên liệu Bến Lức	[]	
T0185	M007		P0021	2023-06-27	2023-06-27 11:00:00	usage	1.545	23354922.00	0.0	36083354.49	0.00	36083354.49	Xuất tuần 4 cho Nhà máy giấy Mỹ Phước	[]	
T0186	M007	S0027		2023-06-30	2023-06-30 08:00:00	purchase	17.002	22916764.00	10.0	389630821.53	38963082.15	428593903.68	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T0187	M007		P0021	2023-06-30	2023-06-30 12:00:00	usage	5.422	23223475.00	0.0	125917681.45	0.00	125917681.45	Xuất tiếp sau nhập bù cho Nhà máy giấy Mỹ Phước	[]	
T0188	M001		P0022	2023-06-26	2023-06-26 17:00:00	usage	7.349	24285038.00	0.0	178470744.26	0.00	178470744.26	Xuất tuần 4 cho Xưởng lắp ráp xe điện	[]	
T0189	M001	S0028		2023-06-28	2023-06-28 08:00:00	purchase	12.505	24321768.00	10.0	304143708.84	30414370.88	334558079.72	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T0190	M001		P0022	2023-06-30	2023-06-30 12:00:00	usage	3.232	24296057.00	0.0	78524856.22	0.00	78524856.22	Xuất tiếp sau nhập bù cho Xưởng lắp ráp xe điện	[]	
T0191	M007		P0023	2023-06-26	2023-06-26 15:00:00	usage	5.161	23223475.00	0.0	119856354.48	0.00	119856354.48	Xuất tuần 4 cho Nhà máy nước giải khát Tây Ninh	[]	
T0192	M020	S0011		2023-07-08	2023-07-08 08:00:00	purchase	2124.000	123006.00	10.0	261264744.00	26126474.40	287391218.40	Nhập kế hoạch tuần đầu tháng 7/2023	[]	
T0193	M018	S0017		2023-07-02	2023-07-02 14:00:00	purchase	165.000	1597157.00	10.0	263530905.00	26353090.50	289883995.50	Nhập kế hoạch tuần đầu tháng 7/2023	[]	
T0194	M009	S0026		2023-07-07	2023-07-07 11:00:00	purchase	12.408	24306327.00	10.0	301592905.42	30159290.54	331752195.96	Nhập kế hoạch tuần đầu tháng 7/2023	[]	
T0195	M015	S0029		2023-07-07	2023-07-07 14:00:00	purchase	3902.000	50286.00	8.0	196215972.00	15697277.76	211913249.76	Nhập kế hoạch tuần đầu tháng 7/2023	[]	
T0196	M011		P0014	2023-07-06	2023-07-06 10:00:00	usage	1.039	26427023.00	0.0	27457676.90	0.00	27457676.90	Xuất tuần 1 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0197	M017	S0021		2023-07-09	2023-07-09 09:00:00	purchase	2317.000	39879.00	10.0	92399643.00	9239964.30	101639607.30	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0198	M017		P0015	2023-07-11	2023-07-11 17:00:00	usage	810.000	38564.00	0.0	31236840.00	0.00	31236840.00	Xuất tiếp sau nhập bù cho Kho hàng cảng Cát Lái	[]	
T0199	M006		P0016	2023-07-03	2023-07-03 09:00:00	usage	1.706	22674144.00	0.0	38682089.66	0.00	38682089.66	Xuất tuần 1 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0200	M008		P0017	2023-07-02	2023-07-02 12:00:00	usage	1.251	25282170.00	0.0	31627994.67	0.00	31627994.67	Xuất tuần 1 cho Nhà máy dược phẩm Tân Uyên	[]	
T0201	M009		P0018	2023-07-07	2023-07-07 11:00:00	usage	2.773	25246835.00	0.0	70009473.46	0.00	70009473.46	Xuất tuần 1 cho Trạm logistics Nhơn Trạch	[]	
T0202	M005		P0019	2023-07-02	2023-07-02 13:00:00	usage	1.217	22555835.00	0.0	27450451.20	0.00	27450451.20	Xuất tuần 1 cho Nhà xưởng cơ điện Quận 12	[]	
T0203	M017		P0017	2023-07-10	2023-07-10 13:00:00	usage	1507.000	38564.00	0.0	58115948.00	0.00	58115948.00	Xuất tuần 2 cho Nhà máy dược phẩm Tân Uyên	[]	
T0204	M017	S0025		2023-07-13	2023-07-13 11:00:00	purchase	1033.000	43021.00	10.0	44440693.00	4444069.30	48884762.30	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0205	M017		P0017	2023-07-16	2023-07-16 13:00:00	usage	567.000	39901.00	0.0	22623867.00	0.00	22623867.00	Xuất tiếp sau nhập bù cho Nhà máy dược phẩm Tân Uyên	[]	
T0206	M020		P0018	2023-07-12	2023-07-12 12:00:00	usage	730.000	118689.00	0.0	86642970.00	0.00	86642970.00	Xuất tuần 2 cho Trạm logistics Nhơn Trạch	[]	
T0207	M017		P0019	2023-07-09	2023-07-09 15:00:00	usage	466.000	39901.00	0.0	18593866.00	0.00	18593866.00	Xuất tuần 2 cho Nhà xưởng cơ điện Quận 12	[]	
T0208	M017	S0027		2023-07-18	2023-07-18 14:00:00	purchase	2644.000	43452.00	10.0	114887088.00	11488708.80	126375796.80	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0209	M017		P0019	2023-07-19	2023-07-19 17:00:00	usage	652.000	40966.00	0.0	26709832.00	0.00	26709832.00	Xuất tiếp sau nhập bù cho Nhà xưởng cơ điện Quận 12	[]	
T0210	M006		P0020	2023-07-14	2023-07-14 11:00:00	usage	2.823	22674144.00	0.0	64009108.51	0.00	64009108.51	Xuất tuần 2 cho Kho nguyên liệu Bến Lức	[]	
T0211	M014	S0029		2023-07-19	2023-07-19 08:00:00	purchase	9588.000	26136.00	10.0	250591968.00	25059196.80	275651164.80	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0212	M014		P0021	2023-07-22	2023-07-22 10:00:00	usage	3358.000	24641.00	0.0	82744478.00	0.00	82744478.00	Xuất tiếp sau nhập bù cho Nhà máy giấy Mỹ Phước	[]	
T0213	M001		P0020	2023-07-18	2023-07-18 16:00:00	usage	3.909	24296057.00	0.0	94973286.81	0.00	94973286.81	Xuất tuần 3 cho Kho nguyên liệu Bến Lức	[]	
T0214	M002		P0021	2023-07-20	2023-07-20 13:00:00	usage	4.960	25193439.00	0.0	124959457.44	0.00	124959457.44	Xuất tuần 3 cho Nhà máy giấy Mỹ Phước	[]	
T0215	M008		P0022	2023-07-16	2023-07-16 17:00:00	usage	4.715	25282170.00	0.0	119205431.55	0.00	119205431.55	Xuất tuần 3 cho Xưởng lắp ráp xe điện	[]	
T0216	M015		P0023	2023-07-20	2023-07-20 09:00:00	usage	1899.000	48019.00	0.0	91188081.00	0.00	91188081.00	Xuất tuần 3 cho Nhà máy nước giải khát Tây Ninh	[]	
T0217	M008		P0024	2023-07-17	2023-07-17 16:00:00	usage	4.661	25282170.00	0.0	117840194.37	0.00	117840194.37	Xuất tuần 3 cho Kho phân phối Bình Chánh	[]	
T0218	M002		P0025	2023-07-16	2023-07-16 13:00:00	usage	2.652	25193439.00	0.0	66813000.23	0.00	66813000.23	Xuất tuần 3 cho Nhà máy sơn Long Thành	[]	
T0219	M018		P0023	2023-07-24	2023-07-24 16:00:00	usage	53.000	1530594.00	0.0	81121482.00	0.00	81121482.00	Xuất tuần 4 cho Nhà máy nước giải khát Tây Ninh	[]	
T0220	M017		P0024	2023-07-23	2023-07-23 12:00:00	usage	1992.000	40966.00	0.0	81604272.00	0.00	81604272.00	Xuất tuần 4 cho Kho phân phối Bình Chánh	[]	
T0221	M017	S0006		2023-07-27	2023-07-27 13:00:00	purchase	606.000	44661.00	10.0	27064566.00	2706456.60	29771022.60	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0222	M017		P0024	2023-07-30	2023-07-30 12:00:00	usage	289.000	42075.00	0.0	12159675.00	0.00	12159675.00	Xuất tiếp sau nhập bù cho Kho phân phối Bình Chánh	[]	
T0223	M018		P0025	2023-07-25	2023-07-25 13:00:00	usage	47.000	1530594.00	0.0	71937918.00	0.00	71937918.00	Xuất tuần 4 cho Nhà máy sơn Long Thành	[]	
T0224	M009		P0026	2023-07-26	2023-07-26 11:00:00	usage	2.340	25246835.00	0.0	59077593.90	0.00	59077593.90	Xuất tuần 4 cho Xưởng bao bì carton Cần Giuộc	[]	
T0225	M001	S0003		2023-08-08	2023-08-08 15:00:00	purchase	8.137	23952545.00	10.0	194901858.67	19490185.87	214392044.53	Nhập kế hoạch tuần đầu tháng 8/2023	[]	
T0226	M016	S0006		2023-08-01	2023-08-01 14:00:00	purchase	8411.000	55540.00	8.0	467146940.00	37371755.20	504518695.20	Nhập kế hoạch tuần đầu tháng 8/2023	[]	
T0227	M004	S0018		2023-08-01	2023-08-01 13:00:00	purchase	10.397	21408324.00	10.0	222582344.63	22258234.46	244840579.09	Nhập kế hoạch tuần đầu tháng 8/2023	[]	
T0228	M010	S0021		2023-08-08	2023-08-08 15:00:00	purchase	8.786	25483638.00	10.0	223899243.47	22389924.35	246289167.81	Nhập kế hoạch tuần đầu tháng 8/2023	[]	
T0229	M017	S0027		2023-08-01	2023-08-01 14:00:00	purchase	5139.000	42514.00	10.0	218479446.00	21847944.60	240327390.60	Nhập kế hoạch tuần đầu tháng 8/2023	[]	
T0230	M015	S0003		2023-08-02	2023-08-02 15:00:00	purchase	8843.000	48838.00	10.0	431874434.00	43187443.40	475061877.40	Nhập kế hoạch tuần đầu tháng 8/2023	[]	
T0231	M018	S0009		2023-08-07	2023-08-07 09:00:00	purchase	295.000	1603777.00	10.0	473114215.00	47311421.50	520425636.50	Nhập kế hoạch tuần đầu tháng 8/2023	[]	
T0232	M006		P0019	2023-08-06	2023-08-06 09:00:00	usage	4.550	22674144.00	0.0	103167355.20	0.00	103167355.20	Xuất tuần 1 cho Nhà xưởng cơ điện Quận 12	[]	
T0233	M006		P0020	2023-08-02	2023-08-02 10:00:00	usage	4.097	22674144.00	0.0	92895967.97	0.00	92895967.97	Xuất tuần 1 cho Kho nguyên liệu Bến Lức	[]	
T0234	M002		P0021	2023-08-05	2023-08-05 17:00:00	usage	4.120	25193439.00	0.0	103796968.68	0.00	103796968.68	Xuất tuần 1 cho Nhà máy giấy Mỹ Phước	[]	
T0235	M014		P0022	2023-08-06	2023-08-06 13:00:00	usage	4211.000	24641.00	0.0	103763251.00	0.00	103763251.00	Xuất tuần 1 cho Xưởng lắp ráp xe điện	[]	
T0236	M003		P0023	2023-08-04	2023-08-04 17:00:00	usage	13.977	23029800.00	0.0	321887514.60	0.00	321887514.60	Xuất tuần 1 cho Nhà máy nước giải khát Tây Ninh	[]	
T0237	M003	S0005		2023-08-07	2023-08-07 08:00:00	purchase	28.303	25226953.00	10.0	713998450.76	71399845.08	785398295.83	Nhập bù sau khi gần cạn tồn Thép I250x125x6x9	[]	
T0238	M003		P0023	2023-08-09	2023-08-09 14:00:00	usage	6.786	23688946.00	0.0	160753187.56	0.00	160753187.56	Xuất tiếp sau nhập bù cho Nhà máy nước giải khát Tây Ninh	[]	
T0239	M004		P0022	2023-08-10	2023-08-10 12:00:00	usage	7.493	22323850.00	0.0	167272608.05	0.00	167272608.05	Xuất tuần 2 cho Xưởng lắp ráp xe điện	[]	
T0240	M002		P0023	2023-08-10	2023-08-10 16:00:00	usage	4.886	25193439.00	0.0	123095142.95	0.00	123095142.95	Xuất tuần 2 cho Nhà máy nước giải khát Tây Ninh	[]	
T0241	M014		P0024	2023-08-12	2023-08-12 10:00:00	usage	2019.000	24641.00	0.0	49750179.00	0.00	49750179.00	Xuất tuần 2 cho Kho phân phối Bình Chánh	[]	
T0242	M014	S0008		2023-08-14	2023-08-14 08:00:00	purchase	10246.000	24015.00	10.0	246057690.00	24605769.00	270663459.00	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0243	M014		P0024	2023-08-15	2023-08-15 09:00:00	usage	2947.000	24453.00	0.0	72062991.00	0.00	72062991.00	Xuất tiếp sau nhập bù cho Kho phân phối Bình Chánh	[]	
T0244	M018		P0025	2023-08-20	2023-08-20 10:00:00	usage	135.000	1548890.00	0.0	209100150.00	0.00	209100150.00	Xuất tuần 3 cho Nhà máy sơn Long Thành	[]	
T0245	M001		P0026	2023-08-18	2023-08-18 16:00:00	usage	8.555	24210179.00	0.0	207118081.35	0.00	207118081.35	Xuất tuần 3 cho Xưởng bao bì carton Cần Giuộc	[]	
T0246	M016		P0027	2023-08-16	2023-08-16 10:00:00	usage	1891.000	52982.00	0.0	100188962.00	0.00	100188962.00	Xuất tuần 3 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0247	M012		P0028	2023-08-16	2023-08-16 17:00:00	usage	1950.000	68521.00	0.0	133615950.00	0.00	133615950.00	Xuất tuần 3 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0248	M015		P0029	2023-08-19	2023-08-19 15:00:00	usage	12870.000	48224.00	0.0	620642880.00	0.00	620642880.00	Xuất tuần 3 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0249	M015	S0015		2023-08-24	2023-08-24 10:00:00	purchase	1082.000	53599.00	10.0	57994118.00	5799411.80	63793529.80	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0250	M015		P0029	2023-08-25	2023-08-25 16:00:00	usage	204.000	49836.00	0.0	10166544.00	0.00	10166544.00	Xuất tiếp sau nhập bù cho Nhà xưởng phụ trợ Dĩ An	[]	
T0251	M003		P0028	2023-08-27	2023-08-27 17:00:00	usage	3.971	23688946.00	0.0	94068804.57	0.00	94068804.57	Xuất tuần 4 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0252	M006		P0029	2023-08-23	2023-08-23 11:00:00	usage	3.836	22674144.00	0.0	86978016.38	0.00	86978016.38	Xuất tuần 4 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0253	M004		P0030	2023-08-23	2023-08-23 16:00:00	usage	8.772	22323850.00	0.0	195824812.20	0.00	195824812.20	Xuất tuần 4 cho Trung tâm vận hành Đức Trọng	[]	
T0254	M004	S0018		2023-08-26	2023-08-26 12:00:00	purchase	16.632	24267701.00	10.0	403620403.03	40362040.30	443982443.34	Nhập bù sau khi gần cạn tồn Thép U200x75x8.5	[]	
T0255	M004		P0030	2023-08-28	2023-08-28 11:00:00	usage	0.349	22907005.00	0.0	7994544.74	0.00	7994544.74	Xuất tiếp sau nhập bù cho Trung tâm vận hành Đức Trọng	[]	
T0256	M005		P0031	2023-08-26	2023-08-26 10:00:00	usage	7.058	22555835.00	0.0	159199083.43	0.00	159199083.43	Xuất tuần 4 cho Nhà máy phân bón Long An	[]	
T0257	M005		P0032	2023-08-26	2023-08-26 09:00:00	usage	13.247	22555835.00	0.0	298797146.25	0.00	298797146.25	Xuất tuần 4 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0258	M005	S0020		2023-08-28	2023-08-28 08:00:00	purchase	47.387	23849608.00	10.0	1130161374.30	113016137.43	1243177511.73	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 6mm	[]	
T0259	M005		P0032	2023-08-29	2023-08-29 17:00:00	usage	11.475	22943967.00	0.0	263282021.33	0.00	263282021.33	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0260	M008	S0016		2023-09-01	2023-09-01 08:00:00	purchase	28.185	27117499.00	10.0	764306709.31	76430670.93	840737380.25	Nhập kế hoạch tuần đầu tháng 9/2023	[]	
T0261	M016	S0019		2023-09-08	2023-09-08 09:00:00	purchase	11848.000	51328.00	10.0	608134144.00	60813414.40	668947558.40	Nhập kế hoạch tuần đầu tháng 9/2023	[]	
T0262	M015	S0025		2023-09-07	2023-09-07 08:00:00	purchase	14021.000	50058.00	8.0	701863218.00	56149057.44	758012275.44	Nhập kế hoạch tuần đầu tháng 9/2023	[]	
T0263	M004	S0028		2023-09-08	2023-09-08 14:00:00	purchase	17.169	24261973.00	10.0	416553814.44	41655381.44	458209195.88	Nhập kế hoạch tuần đầu tháng 9/2023	[]	
T0264	M003	S0001		2023-09-01	2023-09-01 14:00:00	purchase	26.364	24799813.00	10.0	653822269.93	65382226.99	719204496.93	Nhập kế hoạch tuần đầu tháng 9/2023	[]	
T0265	M010	S0007		2023-09-08	2023-09-08 12:00:00	purchase	27.631	25106306.00	10.0	693712341.09	69371234.11	763083575.19	Nhập kế hoạch tuần đầu tháng 9/2023	[]	
T0266	M018	S0010		2023-09-08	2023-09-08 10:00:00	purchase	374.000	1492719.00	8.0	558276906.00	44662152.48	602939058.48	Nhập kế hoạch tuần đầu tháng 9/2023	[]	
T0267	M016		P0024	2023-09-03	2023-09-03 13:00:00	usage	1979.000	52569.00	0.0	104034051.00	0.00	104034051.00	Xuất tuần 1 cho Kho phân phối Bình Chánh	[]	
T0268	M004		P0025	2023-09-07	2023-09-07 12:00:00	usage	3.441	23245747.00	0.0	79988615.43	0.00	79988615.43	Xuất tuần 1 cho Nhà máy sơn Long Thành	[]	
T0269	M004		P0026	2023-09-05	2023-09-05 17:00:00	usage	8.579	23245747.00	0.0	199425263.51	0.00	199425263.51	Xuất tuần 1 cho Xưởng bao bì carton Cần Giuộc	[]	
T0270	M015		P0027	2023-09-12	2023-09-12 16:00:00	usage	3150.000	49892.00	0.0	157159800.00	0.00	157159800.00	Xuất tuần 2 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0271	M018		P0028	2023-09-11	2023-09-11 12:00:00	usage	91.000	1534847.00	0.0	139671077.00	0.00	139671077.00	Xuất tuần 2 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0272	M010		P0029	2023-09-09	2023-09-09 17:00:00	usage	3.998	24829350.00	0.0	99267741.30	0.00	99267741.30	Xuất tuần 2 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0273	M019		P0030	2023-09-17	2023-09-17 11:00:00	usage	122.000	1799187.00	0.0	219500814.00	0.00	219500814.00	Xuất tuần 3 cho Trung tâm vận hành Đức Trọng	[]	
T0274	M019		P0031	2023-09-21	2023-09-21 10:00:00	usage	64.000	1799187.00	0.0	115147968.00	0.00	115147968.00	Xuất tuần 3 cho Nhà máy phân bón Long An	[]	
T0275	M019	S0023		2023-09-29	2023-09-29 09:00:00	purchase	65.000	2002630.00	10.0	130170950.00	13017095.00	143188045.00	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0276	M019		P0031	2023-09-30	2023-09-30 14:00:00	usage	17.000	1860220.00	0.0	31623740.00	0.00	31623740.00	Xuất tiếp sau nhập bù cho Nhà máy phân bón Long An	[]	
T0277	M013		P0032	2023-09-20	2023-09-20 12:00:00	usage	1710.000	18745.00	0.0	32053950.00	0.00	32053950.00	Xuất tuần 3 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0278	M013	S0024		2023-09-23	2023-09-23 11:00:00	purchase	31055.000	20732.00	10.0	643832260.00	64383226.00	708215486.00	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0279	M013		P0032	2023-09-25	2023-09-25 13:00:00	usage	13130.000	19341.00	0.0	253947330.00	0.00	253947330.00	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0280	M010		P0033	2023-09-19	2023-09-19 17:00:00	usage	12.756	24829350.00	0.0	316723188.60	0.00	316723188.60	Xuất tuần 3 cho Nhà xưởng sản xuất pallet	[]	
T0281	M018		P0033	2023-09-24	2023-09-24 13:00:00	usage	191.000	1534847.00	0.0	293155777.00	0.00	293155777.00	Xuất tuần 4 cho Nhà xưởng sản xuất pallet	[]	
T0282	M015		P0034	2023-09-28	2023-09-28 14:00:00	usage	4303.000	49892.00	0.0	214685276.00	0.00	214685276.00	Xuất tuần 4 cho Nhà máy nông sản Cái Bè	[]	
T0283	M011		P0035	2023-09-25	2023-09-25 14:00:00	usage	6.679	26427023.00	0.0	176506086.62	0.00	176506086.62	Xuất tuần 4 cho Xưởng gia công thép Thủ Đức	[]	
T0284	M011	S0029		2023-09-30	2023-09-30 12:00:00	purchase	3.516	25975490.00	10.0	91329822.84	9132982.28	100462805.12	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0285	M011		P0035	2023-09-30	2023-09-30 12:00:00	usage	0.203	26291563.00	0.0	5337187.29	0.00	5337187.29	Xuất tiếp sau nhập bù cho Xưởng gia công thép Thủ Đức	[]	
T0286	M018		P0024	2023-09-27	2023-09-27 15:00:00	return	10.000	1534847.00	0.0	15348470.00	0.00	15348470.00	Trả vật tư dư cuối tháng từ Kho phân phối Bình Chánh	[]	
T0287	M015	S0017		2023-10-06	2023-10-06 09:00:00	purchase	10448.000	47178.00	10.0	492915744.00	49291574.40	542207318.40	Nhập kế hoạch tuần đầu tháng 10/2023	[]	
T0288	M018	S0005		2023-10-02	2023-10-02 14:00:00	purchase	179.000	1655350.00	8.0	296307650.00	23704612.00	320012262.00	Nhập kế hoạch tuần đầu tháng 10/2023	[]	
T0289	M012		P0029	2023-10-03	2023-10-03 10:00:00	usage	953.000	68521.00	0.0	65300513.00	0.00	65300513.00	Xuất tuần 1 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0290	M009		P0030	2023-10-07	2023-10-07 16:00:00	usage	6.148	25246835.00	0.0	155217541.58	0.00	155217541.58	Xuất tuần 1 cho Trung tâm vận hành Đức Trọng	[]	
T0291	M017		P0031	2023-10-04	2023-10-04 15:00:00	usage	1708.000	42185.00	0.0	72051980.00	0.00	72051980.00	Xuất tuần 1 cho Nhà máy phân bón Long An	[]	
T0292	M018		P0032	2023-10-05	2023-10-05 16:00:00	usage	43.000	1564973.00	0.0	67293839.00	0.00	67293839.00	Xuất tuần 1 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0293	M012		P0033	2023-10-05	2023-10-05 12:00:00	usage	1297.000	68521.00	0.0	88871737.00	0.00	88871737.00	Xuất tuần 1 cho Nhà xưởng sản xuất pallet	[]	
T0294	M012		P0032	2023-10-12	2023-10-12 11:00:00	usage	701.000	68521.00	0.0	48033221.00	0.00	48033221.00	Xuất tuần 2 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0295	M012	S0028		2023-10-16	2023-10-16 08:00:00	purchase	4876.000	74901.00	10.0	365217276.00	36521727.60	401739003.60	Nhập bù sau khi gần cạn tồn Bu lông neo M24x700	[]	
T0296	M012		P0032	2023-10-17	2023-10-17 09:00:00	usage	2398.000	70435.00	0.0	168903130.00	0.00	168903130.00	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0297	M012		P0033	2023-10-10	2023-10-10 10:00:00	usage	1863.000	70435.00	0.0	131220405.00	0.00	131220405.00	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T0298	M009		P0034	2023-10-09	2023-10-09 09:00:00	usage	7.027	25246835.00	0.0	177409509.55	0.00	177409509.55	Xuất tuần 2 cho Nhà máy nông sản Cái Bè	[]	
T0299	M009	S0030		2023-10-15	2023-10-15 08:00:00	purchase	6.272	25734212.00	10.0	161404977.66	16140497.77	177545475.43	Nhập bù sau khi gần cạn tồn Thép hộp 150x150x5	[]	
T0300	M009		P0034	2023-10-16	2023-10-16 10:00:00	usage	0.658	25393048.00	0.0	16708625.58	0.00	16708625.58	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T0301	M005		P0035	2023-10-18	2023-10-18 17:00:00	usage	7.371	22943967.00	0.0	169119980.76	0.00	169119980.76	Xuất tuần 3 cho Xưởng gia công thép Thủ Đức	[]	
T0302	M005		P0036	2023-10-17	2023-10-17 09:00:00	usage	6.207	22943967.00	0.0	142413203.17	0.00	142413203.17	Xuất tuần 3 cho Kho ngoại quan Hiệp Phước	[]	
T0303	M002		P0037	2023-10-17	2023-10-17 16:00:00	usage	5.219	25193439.00	0.0	131484558.14	0.00	131484558.14	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T0304	M018		P0038	2023-10-19	2023-10-19 10:00:00	usage	89.000	1564973.00	0.0	139282597.00	0.00	139282597.00	Xuất tuần 3 cho Trung tâm bảo trì thiết bị	[]	
T0305	M017		P0039	2023-10-19	2023-10-19 14:00:00	usage	2626.000	42185.00	0.0	110777810.00	0.00	110777810.00	Xuất tuần 3 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0306	M018		P0038	2023-10-25	2023-10-25 15:00:00	usage	101.000	1564973.00	0.0	158062273.00	0.00	158062273.00	Xuất tuần 4 cho Trung tâm bảo trì thiết bị	[]	
T0307	M002		P0039	2023-10-28	2023-10-28 17:00:00	usage	0.705	25193439.00	0.0	17761374.49	0.00	17761374.49	Xuất tuần 4 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0308	M002	S0009		2023-10-31	2023-10-31 12:00:00	purchase	17.140	25170747.00	10.0	431426603.58	43142660.36	474569263.94	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0309	M002		P0039	2023-10-31	2023-10-31 10:00:00	usage	4.305	25186631.00	0.0	108428446.46	0.00	108428446.46	Xuất tiếp sau nhập bù cho Nhà máy chế biến gạo Sa Đéc	[]	
T0310	M009		P0040	2023-10-23	2023-10-23 13:00:00	usage	5.053	25393048.00	0.0	128311071.54	0.00	128311071.54	Xuất tuần 4 cho Xưởng sản xuất container module	[]	
T0311	M004	S0027		2023-11-04	2023-11-04 15:00:00	purchase	6.859	23455839.00	10.0	160883599.70	16088359.97	176971959.67	Nhập kế hoạch tuần đầu tháng 11/2023	[]	
T0312	M012	S0009		2023-11-08	2023-11-08 14:00:00	purchase	4693.000	73256.00	8.0	343790408.00	27503232.64	371293640.64	Nhập kế hoạch tuần đầu tháng 11/2023	[]	
T0313	M011		P0034	2023-11-07	2023-11-07 10:00:00	usage	3.313	26291563.00	0.0	87103948.22	0.00	87103948.22	Xuất tuần 1 cho Nhà máy nông sản Cái Bè	[]	
T0314	M011	S0004		2023-11-16	2023-11-16 13:00:00	purchase	5.153	28071523.00	10.0	144652558.02	14465255.80	159117813.82	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0315	M011		P0034	2023-11-18	2023-11-18 11:00:00	usage	1.347	26825551.00	0.0	36134017.20	0.00	36134017.20	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T0316	M012		P0035	2023-11-06	2023-11-06 13:00:00	usage	1199.000	71140.00	0.0	85296860.00	0.00	85296860.00	Xuất tuần 1 cho Xưởng gia công thép Thủ Đức	[]	
T0317	M016		P0036	2023-11-02	2023-11-02 14:00:00	usage	1184.000	52569.00	0.0	62241696.00	0.00	62241696.00	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T0318	M001		P0037	2023-11-05	2023-11-05 12:00:00	usage	4.946	24210179.00	0.0	119743545.33	0.00	119743545.33	Xuất tuần 1 cho Nhà máy điện mặt trời phụ trợ	[]	
T0319	M001	S0007		2023-11-12	2023-11-12 14:00:00	purchase	9.296	25790577.00	10.0	239749203.79	23974920.38	263724124.17	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T0320	M001		P0037	2023-11-13	2023-11-13 15:00:00	usage	0.706	24684298.00	0.0	17427114.39	0.00	17427114.39	Xuất tiếp sau nhập bù cho Nhà máy điện mặt trời phụ trợ	[]	
T0321	M001		P0038	2023-11-06	2023-11-06 11:00:00	usage	5.908	24684298.00	0.0	145834832.58	0.00	145834832.58	Xuất tuần 1 cho Trung tâm bảo trì thiết bị	[]	
T0322	M016		P0037	2023-11-14	2023-11-14 10:00:00	usage	1188.000	52569.00	0.0	62451972.00	0.00	62451972.00	Xuất tuần 2 cho Nhà máy điện mặt trời phụ trợ	[]	
T0323	M016		P0038	2023-11-09	2023-11-09 16:00:00	usage	2003.000	52569.00	0.0	105295707.00	0.00	105295707.00	Xuất tuần 2 cho Trung tâm bảo trì thiết bị	[]	
T0324	M015		P0039	2023-11-11	2023-11-11 09:00:00	usage	1994.000	49214.00	0.0	98132716.00	0.00	98132716.00	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0325	M016		P0040	2023-11-09	2023-11-09 13:00:00	usage	929.000	52569.00	0.0	48836601.00	0.00	48836601.00	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T0326	M001		P0001	2023-11-13	2023-11-13 15:00:00	usage	2.682	24684298.00	0.0	66203287.24	0.00	66203287.24	Xuất tuần 2 cho Nhà xưởng Sunrise Long An	[]	
T0327	M001	S0013		2023-11-15	2023-11-15 13:00:00	purchase	10.276	26012468.00	10.0	267304121.17	26730412.12	294034533.28	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T0328	M001		P0001	2023-11-18	2023-11-18 14:00:00	usage	0.743	25082749.00	0.0	18636482.51	0.00	18636482.51	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T0329	M019		P0002	2023-11-12	2023-11-12 11:00:00	usage	25.000	1860220.00	0.0	46505500.00	0.00	46505500.00	Xuất tuần 2 cho Kho lạnh Mekong Logistics	[]	
T0330	M016		P0040	2023-11-21	2023-11-21 14:00:00	usage	3038.000	52569.00	0.0	159704622.00	0.00	159704622.00	Xuất tuần 3 cho Xưởng sản xuất container module	[]	
T0331	M011		P0001	2023-11-18	2023-11-18 11:00:00	usage	3.806	26825551.00	0.0	102098047.11	0.00	102098047.11	Xuất tuần 3 cho Nhà xưởng Sunrise Long An	[]	
T0332	M011	S0015		2023-11-20	2023-11-20 10:00:00	purchase	6.604	26152392.00	10.0	172710396.77	17271039.68	189981436.44	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0333	M011		P0001	2023-11-23	2023-11-23 14:00:00	usage	0.085	26623603.00	0.0	2263006.26	0.00	2263006.26	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T0334	M020		P0002	2023-11-16	2023-11-16 15:00:00	usage	1111.000	118689.00	0.0	131863479.00	0.00	131863479.00	Xuất tuần 3 cho Kho lạnh Mekong Logistics	[]	
T0335	M002		P0003	2023-11-18	2023-11-18 16:00:00	usage	4.172	25186631.00	0.0	105078624.53	0.00	105078624.53	Xuất tuần 3 cho Nhà máy bao bì Tân Phú	[]	
T0336	M019		P0003	2023-11-24	2023-11-24 11:00:00	usage	23.000	1860220.00	0.0	42785060.00	0.00	42785060.00	Xuất tuần 4 cho Nhà máy bao bì Tân Phú	[]	
T0337	M019	S0019		2023-11-27	2023-11-27 14:00:00	purchase	57.000	1946619.00	10.0	110957283.00	11095728.30	122053011.30	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0338	M019		P0003	2023-11-29	2023-11-29 12:00:00	usage	20.000	1886140.00	0.0	37722800.00	0.00	37722800.00	Xuất tiếp sau nhập bù cho Nhà máy bao bì Tân Phú	[]	
T0339	M016		P0004	2023-11-26	2023-11-26 16:00:00	usage	2183.000	52569.00	0.0	114758127.00	0.00	114758127.00	Xuất tuần 4 cho Xưởng cơ khí Bình Dương	[]	
T0340	M020		P0005	2023-11-26	2023-11-26 12:00:00	usage	812.000	118689.00	0.0	96375468.00	0.00	96375468.00	Xuất tuần 4 cho Trung tâm phân phối An Sương	[]	
T0341	M002		P0006	2023-11-25	2023-11-25 12:00:00	usage	3.264	25186631.00	0.0	82209163.58	0.00	82209163.58	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T0342	M011		P0034	2023-11-25	2023-11-25 15:00:00	return	1.304	26623603.00	0.0	34717178.31	0.00	34717178.31	Trả vật tư dư cuối tháng từ Nhà máy nông sản Cái Bè	[]	
T0343	M018	S0001		2023-12-07	2023-12-07 13:00:00	purchase	386.000	1528434.00	10.0	589975524.00	58997552.40	648973076.40	Nhập kế hoạch tuần đầu tháng 12/2023	[]	
T0344	M016	S0010		2023-12-01	2023-12-01 12:00:00	purchase	11097.000	50816.00	8.0	563905152.00	45112412.16	609017564.16	Nhập kế hoạch tuần đầu tháng 12/2023	[]	
T0345	M005	S0019		2023-12-04	2023-12-04 10:00:00	purchase	17.910	22114126.00	10.0	396063996.66	39606399.67	435670396.33	Nhập kế hoạch tuần đầu tháng 12/2023	[]	
T0346	M013	S0025		2023-12-01	2023-12-01 15:00:00	purchase	20820.000	18588.00	10.0	387002160.00	38700216.00	425702376.00	Nhập kế hoạch tuần đầu tháng 12/2023	[]	
T0347	M012	S0001		2023-12-02	2023-12-02 10:00:00	purchase	4022.000	75004.00	10.0	301666088.00	30166608.80	331832696.80	Nhập kế hoạch tuần đầu tháng 12/2023	[]	
T0348	M005		P0039	2023-12-02	2023-12-02 13:00:00	usage	7.954	22736507.00	0.0	180846176.68	0.00	180846176.68	Xuất tuần 1 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0349	M020		P0040	2023-12-02	2023-12-02 10:00:00	usage	409.000	118689.00	0.0	48543801.00	0.00	48543801.00	Xuất tuần 1 cho Xưởng sản xuất container module	[]	
T0350	M020	S0016		2023-12-10	2023-12-10 10:00:00	purchase	2622.000	128709.00	10.0	337474998.00	33747499.80	371222497.80	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T0351	M020		P0040	2023-12-12	2023-12-12 11:00:00	usage	814.000	121695.00	0.0	99059730.00	0.00	99059730.00	Xuất tiếp sau nhập bù cho Xưởng sản xuất container module	[]	
T0352	M007		P0001	2023-12-02	2023-12-02 16:00:00	usage	6.419	23223475.00	0.0	149071486.02	0.00	149071486.02	Xuất tuần 1 cho Nhà xưởng Sunrise Long An	[]	
T0353	M007	S0017		2023-12-11	2023-12-11 10:00:00	purchase	18.028	25459810.00	10.0	458989454.68	45898945.47	504888400.15	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T0354	M007		P0001	2023-12-14	2023-12-14 13:00:00	usage	1.252	23894376.00	0.0	29915758.75	0.00	29915758.75	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T0355	M013		P0002	2023-12-02	2023-12-02 13:00:00	usage	4710.000	19153.00	0.0	90210630.00	0.00	90210630.00	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T0356	M016		P0002	2023-12-10	2023-12-10 16:00:00	usage	3503.000	52131.00	0.0	182614893.00	0.00	182614893.00	Xuất tuần 2 cho Kho lạnh Mekong Logistics	[]	
T0357	M018		P0003	2023-12-12	2023-12-12 14:00:00	usage	125.000	1555838.00	0.0	194479750.00	0.00	194479750.00	Xuất tuần 2 cho Nhà máy bao bì Tân Phú	[]	
T0358	M006		P0004	2023-12-13	2023-12-13 13:00:00	usage	5.856	22674144.00	0.0	132779787.26	0.00	132779787.26	Xuất tuần 2 cho Xưởng cơ khí Bình Dương	[]	
T0359	M014		P0005	2023-12-09	2023-12-09 13:00:00	usage	7299.000	24453.00	0.0	178482447.00	0.00	178482447.00	Xuất tuần 2 cho Trung tâm phân phối An Sương	[]	
T0360	M014	S0023		2023-12-18	2023-12-18 08:00:00	purchase	3742.000	26201.00	10.0	98044142.00	9804414.20	107848556.20	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0361	M014		P0005	2023-12-19	2023-12-19 16:00:00	usage	1602.000	24977.00	0.0	40013154.00	0.00	40013154.00	Xuất tiếp sau nhập bù cho Trung tâm phân phối An Sương	[]	
T0362	M012		P0005	2023-12-21	2023-12-21 10:00:00	usage	3292.000	72106.00	0.0	237372952.00	0.00	237372952.00	Xuất tuần 3 cho Trung tâm phân phối An Sương	[]	
T0363	M017		P0006	2023-12-21	2023-12-21 15:00:00	usage	1122.000	42185.00	0.0	47331570.00	0.00	47331570.00	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T0364	M017	S0026		2023-12-29	2023-12-29 13:00:00	purchase	8042.000	42127.00	10.0	338785334.00	33878533.40	372663867.40	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0365	M017		P0006	2023-12-31	2023-12-31 10:00:00	usage	4179.000	42168.00	0.0	176220072.00	0.00	176220072.00	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T0366	M013		P0007	2023-12-18	2023-12-18 15:00:00	usage	11002.000	19153.00	0.0	210721306.00	0.00	210721306.00	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T0367	M012		P0008	2023-12-21	2023-12-21 17:00:00	usage	1959.000	72106.00	0.0	141255654.00	0.00	141255654.00	Xuất tuần 3 cho Nhà xưởng may Phước Đông	[]	
T0368	M020		P0008	2023-12-27	2023-12-27 14:00:00	usage	870.000	121695.00	0.0	105874650.00	0.00	105874650.00	Xuất tuần 4 cho Nhà xưởng may Phước Đông	[]	
T0369	M007		P0009	2023-12-25	2023-12-25 15:00:00	usage	8.659	23894376.00	0.0	206901401.78	0.00	206901401.78	Xuất tuần 4 cho Nhà máy nhựa Nam Việt	[]	
T0370	M020		P0010	2023-12-25	2023-12-25 11:00:00	usage	938.000	121695.00	0.0	114149910.00	0.00	114149910.00	Xuất tuần 4 cho Khu bảo trì xe buýt Củ Chi	[]	
T0371	M020	S0002		2023-12-31	2023-12-31 13:00:00	purchase	671.000	128749.00	10.0	86390579.00	8639057.90	95029636.90	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T0372	M020		P0010	2023-12-31	2023-12-31 15:00:00	usage	80.000	123811.00	0.0	9904880.00	0.00	9904880.00	Xuất tiếp sau nhập bù cho Khu bảo trì xe buýt Củ Chi	[]	
T0373	M006		P0011	2023-12-28	2023-12-28 16:00:00	usage	6.747	22674144.00	0.0	152982449.57	0.00	152982449.57	Xuất tuần 4 cho Nhà máy gỗ Đức Hòa	[]	
T0374	M014		P0012	2023-12-27	2023-12-27 11:00:00	usage	2140.000	24977.00	0.0	53450780.00	0.00	53450780.00	Xuất tuần 4 cho Kho tổng hợp Sóng Thần	[]	
T0375	M014	S0004		2023-12-31	2023-12-31 09:00:00	purchase	7769.000	25691.00	10.0	199593379.00	19959337.90	219552716.90	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0376	M014		P0012	2023-12-31	2023-12-31 13:00:00	usage	5042.000	25191.00	0.0	127013022.00	0.00	127013022.00	Xuất tiếp sau nhập bù cho Kho tổng hợp Sóng Thần	[]	
T0377	M006		P0013	2023-12-28	2023-12-28 16:00:00	usage	8.191	22674144.00	0.0	185723913.50	0.00	185723913.50	Xuất tuần 4 cho Nhà xưởng điện tử VSIP	[]	
T0378	M005		P0039	2023-12-25	2023-12-25 15:00:00	return	6.458	22736507.00	0.0	146832362.21	0.00	146832362.21	Trả vật tư dư cuối tháng từ Nhà máy chế biến gạo Sa Đéc	[]	
T0379	M011	S0015		2024-01-04	2024-01-04 14:00:00	purchase	9.002	27031267.00	8.0	243335465.53	19466837.24	262802302.78	Nhập theo chu kỳ dài Ống thép D114x4.0 tháng 1/2024	[]	
T0380	M001	S0018		2024-01-01	2024-01-01 15:00:00	purchase	8.032	24046487.00	10.0	193141383.58	19314138.36	212455521.94	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0381	M002	S0021		2024-01-04	2024-01-04 13:00:00	purchase	19.152	25824733.00	8.0	494595286.42	39567622.91	534162909.33	Nhập theo chu kỳ dài Thép hình H300x300x10x15 tháng 1/2024	[]	
T0382	M016	S0024		2024-01-08	2024-01-08 09:00:00	purchase	5189.000	51826.00	10.0	268925114.00	26892511.40	295817625.40	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0383	M012	S0027		2024-01-03	2024-01-03 14:00:00	purchase	4262.000	70165.00	8.0	299043230.00	23923458.40	322966688.40	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0384	M003	S0030		2024-01-05	2024-01-05 09:00:00	purchase	11.728	23724201.00	10.0	278237429.33	27823742.93	306061172.26	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0385	M018	S0003		2024-01-08	2024-01-08 11:00:00	purchase	169.000	1540905.00	10.0	260412945.00	26041294.50	286454239.50	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0386	M006	S0006		2024-01-03	2024-01-03 11:00:00	purchase	18.534	22344843.00	8.0	414139320.16	33131145.61	447270465.77	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0387	M005	S0009		2024-01-03	2024-01-03 08:00:00	purchase	16.568	24065029.00	10.0	398709400.47	39870940.05	438580340.52	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0388	M014	S0012		2024-01-02	2024-01-02 09:00:00	purchase	10749.000	24184.00	10.0	259953816.00	25995381.60	285949197.60	Nhập theo chu kỳ dài Bu lông cường độ cao M22x80 tháng 1/2024	[]	
T0389	M020	S0015		2024-01-06	2024-01-06 09:00:00	purchase	1455.000	129154.00	8.0	187919070.00	15033525.60	202952595.60	Nhập kế hoạch tuần đầu tháng 1/2024	[]	
T0390	M006		P0025	2024-01-04	2024-01-04 10:00:00	usage	4.526	22591819.00	0.0	102250572.79	0.00	102250572.79	Xuất tuần 1 cho Nhà máy sơn Long Thành	[]	
T0391	M001		P0026	2024-01-05	2024-01-05 14:00:00	usage	5.231	24823684.00	0.0	129852691.00	0.00	129852691.00	Xuất tuần 1 cho Xưởng bao bì carton Cần Giuộc	[]	
T0392	M003		P0027	2024-01-04	2024-01-04 12:00:00	usage	3.332	23906048.00	0.0	79654951.94	0.00	79654951.94	Xuất tuần 1 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0393	M003		P0028	2024-01-09	2024-01-09 13:00:00	usage	7.243	23906048.00	0.0	173151505.66	0.00	173151505.66	Xuất tuần 2 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0394	M003		P0029	2024-01-11	2024-01-11 16:00:00	usage	3.808	23906048.00	0.0	91034230.78	0.00	91034230.78	Xuất tuần 2 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0395	M011		P0030	2024-01-11	2024-01-11 15:00:00	usage	2.637	26725519.00	0.0	70475193.60	0.00	70475193.60	Xuất tuần 2 cho Trung tâm vận hành Đức Trọng	[]	
T0396	M020		P0031	2024-01-14	2024-01-14 10:00:00	usage	668.000	125147.00	0.0	83598196.00	0.00	83598196.00	Xuất tuần 2 cho Nhà máy phân bón Long An	[]	
T0397	M011		P0032	2024-01-09	2024-01-09 13:00:00	usage	5.700	26725519.00	0.0	152335458.30	0.00	152335458.30	Xuất tuần 2 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0398	M005		P0033	2024-01-13	2024-01-13 11:00:00	usage	4.948	23068638.00	0.0	114143620.82	0.00	114143620.82	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T0399	M018		P0031	2024-01-19	2024-01-19 14:00:00	usage	119.000	1552105.00	0.0	184700495.00	0.00	184700495.00	Xuất tuần 3 cho Nhà máy phân bón Long An	[]	
T0400	M003		P0032	2024-01-19	2024-01-19 17:00:00	usage	5.729	23906048.00	0.0	136957748.99	0.00	136957748.99	Xuất tuần 3 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0401	M014		P0033	2024-01-21	2024-01-21 17:00:00	usage	4328.000	24939.00	0.0	107935992.00	0.00	107935992.00	Xuất tuần 3 cho Nhà xưởng sản xuất pallet	[]	
T0402	M001		P0034	2024-01-19	2024-01-19 15:00:00	usage	8.681	24823684.00	0.0	215494400.80	0.00	215494400.80	Xuất tuần 3 cho Nhà máy nông sản Cái Bè	[]	
T0403	M014		P0035	2024-01-17	2024-01-17 15:00:00	usage	4059.000	24939.00	0.0	101227401.00	0.00	101227401.00	Xuất tuần 3 cho Xưởng gia công thép Thủ Đức	[]	
T0404	M020		P0034	2024-01-25	2024-01-25 17:00:00	usage	678.000	125147.00	0.0	84849666.00	0.00	84849666.00	Xuất tuần 4 cho Nhà máy nông sản Cái Bè	[]	
T0405	M014		P0035	2024-01-23	2024-01-23 11:00:00	usage	4425.000	24939.00	0.0	110355075.00	0.00	110355075.00	Xuất tuần 4 cho Xưởng gia công thép Thủ Đức	[]	
T0406	M006		P0036	2024-01-26	2024-01-26 17:00:00	usage	5.065	22591819.00	0.0	114427563.24	0.00	114427563.24	Xuất tuần 4 cho Kho ngoại quan Hiệp Phước	[]	
T0407	M001		P0037	2024-01-26	2024-01-26 09:00:00	usage	3.653	24823684.00	0.0	90680917.65	0.00	90680917.65	Xuất tuần 4 cho Nhà máy điện mặt trời phụ trợ	[]	
T0408	M001	S0003		2024-01-31	2024-01-31 09:00:00	purchase	8.102	24014528.00	10.0	194565705.86	19456570.59	214022276.44	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T0409	M001		P0037	2024-01-31	2024-01-31 16:00:00	usage	1.352	24580937.00	0.0	33233426.82	0.00	33233426.82	Xuất tiếp sau nhập bù cho Nhà máy điện mặt trời phụ trợ	[]	
T0410	M011		P0038	2024-01-28	2024-01-28 17:00:00	usage	3.568	26725519.00	0.0	95356651.79	0.00	95356651.79	Xuất tuần 4 cho Trung tâm bảo trì thiết bị	[]	
T0411	M012	S0022		2024-02-05	2024-02-05 14:00:00	purchase	3154.000	76629.00	8.0	241687866.00	19335029.28	261022895.28	Nhập kế hoạch tuần đầu tháng 2/2024	[]	
T0412	M001	S0001		2024-02-06	2024-02-06 13:00:00	purchase	12.903	25360213.00	10.0	327222828.34	32722282.83	359945111.17	Nhập kế hoạch tuần đầu tháng 2/2024	[]	
T0413	M010	S0013		2024-02-01	2024-02-01 14:00:00	purchase	12.778	26640660.00	10.0	340414353.48	34041435.35	374455788.83	Nhập kế hoạch tuần đầu tháng 2/2024	[]	
T0414	M008	S0019		2024-02-04	2024-02-04 14:00:00	purchase	15.940	27379449.00	10.0	436428417.06	43642841.71	480071258.77	Nhập kế hoạch tuần đầu tháng 2/2024	[]	
T0415	M019		P0030	2024-02-06	2024-02-06 14:00:00	usage	37.000	1886140.00	0.0	69787180.00	0.00	69787180.00	Xuất tuần 1 cho Trung tâm vận hành Đức Trọng	[]	
T0416	M019	S0026		2024-02-13	2024-02-13 13:00:00	purchase	180.000	2092303.00	10.0	376614540.00	37661454.00	414275994.00	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0417	M019		P0030	2024-02-14	2024-02-14 09:00:00	usage	59.000	1947989.00	0.0	114931351.00	0.00	114931351.00	Xuất tiếp sau nhập bù cho Trung tâm vận hành Đức Trọng	[]	
T0418	M020		P0031	2024-02-06	2024-02-06 13:00:00	usage	700.000	125147.00	0.0	87602900.00	0.00	87602900.00	Xuất tuần 1 cho Nhà máy phân bón Long An	[]	
T0419	M020	S0027		2024-02-08	2024-02-08 08:00:00	purchase	329.000	128957.00	10.0	42426853.00	4242685.30	46669538.30	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T0420	M020		P0031	2024-02-10	2024-02-10 16:00:00	usage	50.000	126290.00	0.0	6314500.00	0.00	6314500.00	Xuất tiếp sau nhập bù cho Nhà máy phân bón Long An	[]	
T0421	M020		P0032	2024-02-02	2024-02-02 11:00:00	usage	279.000	126290.00	0.0	35234910.00	0.00	35234910.00	Xuất tuần 1 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0422	M020	S0028		2024-02-08	2024-02-08 11:00:00	purchase	2478.000	138529.00	10.0	343274862.00	34327486.20	377602348.20	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T0423	M020		P0032	2024-02-11	2024-02-11 10:00:00	usage	776.000	129962.00	0.0	100850512.00	0.00	100850512.00	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0424	M008		P0033	2024-02-04	2024-02-04 14:00:00	usage	3.278	26150614.00	0.0	85721712.69	0.00	85721712.69	Xuất tuần 1 cho Nhà xưởng sản xuất pallet	[]	
T0425	M001		P0033	2024-02-11	2024-02-11 12:00:00	usage	4.041	24775756.00	0.0	100118830.00	0.00	100118830.00	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T0426	M007		P0034	2024-02-10	2024-02-10 14:00:00	usage	4.540	23894376.00	0.0	108480467.04	0.00	108480467.04	Xuất tuần 2 cho Nhà máy nông sản Cái Bè	[]	
T0427	M017		P0035	2024-02-09	2024-02-09 12:00:00	usage	2161.000	42168.00	0.0	91125048.00	0.00	91125048.00	Xuất tuần 2 cho Xưởng gia công thép Thủ Đức	[]	
T0428	M008		P0036	2024-02-17	2024-02-17 17:00:00	usage	3.965	26150614.00	0.0	103687184.51	0.00	103687184.51	Xuất tuần 3 cho Kho ngoại quan Hiệp Phước	[]	
T0429	M020		P0037	2024-02-19	2024-02-19 15:00:00	usage	851.000	129962.00	0.0	110597662.00	0.00	110597662.00	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T0430	M008		P0038	2024-02-17	2024-02-17 09:00:00	usage	2.864	26150614.00	0.0	74895358.50	0.00	74895358.50	Xuất tuần 3 cho Trung tâm bảo trì thiết bị	[]	
T0431	M017		P0039	2024-02-17	2024-02-17 11:00:00	usage	1702.000	42168.00	0.0	71769936.00	0.00	71769936.00	Xuất tuần 3 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0432	M017	S0009		2024-02-24	2024-02-24 13:00:00	purchase	2873.000	40831.00	10.0	117307463.00	11730746.30	129038209.30	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0433	M017		P0039	2024-02-27	2024-02-27 09:00:00	usage	804.000	41767.00	0.0	33580668.00	0.00	33580668.00	Xuất tiếp sau nhập bù cho Nhà máy chế biến gạo Sa Đéc	[]	
T0434	M018		P0040	2024-02-18	2024-02-18 15:00:00	usage	71.000	1552105.00	0.0	110199455.00	0.00	110199455.00	Xuất tuần 3 cho Xưởng sản xuất container module	[]	
T0435	M012		P0039	2024-02-25	2024-02-25 14:00:00	usage	700.000	72873.00	0.0	51011100.00	0.00	51011100.00	Xuất tuần 4 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0436	M019		P0040	2024-02-28	2024-02-28 10:00:00	usage	65.000	1947989.00	0.0	126619285.00	0.00	126619285.00	Xuất tuần 4 cho Xưởng sản xuất container module	[]	
T0437	M019		P0001	2024-02-28	2024-02-28 14:00:00	usage	31.000	1947989.00	0.0	60387659.00	0.00	60387659.00	Xuất tuần 4 cho Nhà xưởng Sunrise Long An	[]	
T0438	M001		P0002	2024-02-28	2024-02-28 09:00:00	usage	4.253	24775756.00	0.0	105371290.27	0.00	105371290.27	Xuất tuần 4 cho Kho lạnh Mekong Logistics	[]	
T0439	M012	S0017		2024-03-04	2024-03-04 12:00:00	purchase	8928.000	74123.00	10.0	661770144.00	66177014.40	727947158.40	Nhập kế hoạch tuần đầu tháng 3/2024	[]	
T0440	M018		P0035	2024-03-03	2024-03-03 13:00:00	usage	140.000	1552105.00	0.0	217294700.00	0.00	217294700.00	Xuất tuần 1 cho Xưởng gia công thép Thủ Đức	[]	
T0441	M015		P0036	2024-03-02	2024-03-02 17:00:00	usage	3002.000	49214.00	0.0	147740428.00	0.00	147740428.00	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T0442	M014		P0037	2024-03-04	2024-03-04 14:00:00	usage	664.000	24939.00	0.0	16559496.00	0.00	16559496.00	Xuất tuần 1 cho Nhà máy điện mặt trời phụ trợ	[]	
T0443	M014	S0009		2024-03-10	2024-03-10 10:00:00	purchase	14415.000	27757.00	10.0	400117155.00	40011715.50	440128870.50	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0444	M014		P0037	2024-03-13	2024-03-13 15:00:00	usage	6914.000	25784.00	0.0	178270576.00	0.00	178270576.00	Xuất tiếp sau nhập bù cho Nhà máy điện mặt trời phụ trợ	[]	
T0445	M005		P0038	2024-03-05	2024-03-05 15:00:00	usage	11.114	23068638.00	0.0	256384842.73	0.00	256384842.73	Xuất tuần 1 cho Trung tâm bảo trì thiết bị	[]	
T0446	M006		P0039	2024-03-07	2024-03-07 10:00:00	usage	17.036	22591819.00	0.0	384874228.48	0.00	384874228.48	Xuất tuần 1 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0447	M006	S0011		2024-03-16	2024-03-16 11:00:00	purchase	39.110	23437419.00	10.0	916637457.09	91663745.71	1008301202.80	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 10mm	[]	
T0448	M006		P0039	2024-03-18	2024-03-18 16:00:00	usage	15.676	22845499.00	0.0	358126042.32	0.00	358126042.32	Xuất tiếp sau nhập bù cho Nhà máy chế biến gạo Sa Đéc	[]	
T0449	M016		P0038	2024-03-13	2024-03-13 17:00:00	usage	3226.000	52055.00	0.0	167929430.00	0.00	167929430.00	Xuất tuần 2 cho Trung tâm bảo trì thiết bị	[]	
T0450	M013		P0039	2024-03-11	2024-03-11 12:00:00	usage	7274.000	19153.00	0.0	139318922.00	0.00	139318922.00	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0451	M018		P0040	2024-03-10	2024-03-10 09:00:00	usage	418.000	1552105.00	0.0	648779890.00	0.00	648779890.00	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T0452	M018	S0014		2024-03-19	2024-03-19 12:00:00	purchase	50.000	1562830.00	10.0	78141500.00	7814150.00	85955650.00	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0453	M018		P0040	2024-03-20	2024-03-20 12:00:00	usage	11.000	1555323.00	0.0	17108553.00	0.00	17108553.00	Xuất tiếp sau nhập bù cho Xưởng sản xuất container module	[]	
T0454	M015		P0001	2024-03-18	2024-03-18 15:00:00	usage	4116.000	49214.00	0.0	202564824.00	0.00	202564824.00	Xuất tuần 3 cho Nhà xưởng Sunrise Long An	[]	
T0455	M012		P0002	2024-03-18	2024-03-18 13:00:00	usage	2411.000	73186.00	0.0	176451446.00	0.00	176451446.00	Xuất tuần 3 cho Kho lạnh Mekong Logistics	[]	
T0456	M015		P0003	2024-03-17	2024-03-17 17:00:00	usage	6445.000	49214.00	0.0	317184230.00	0.00	317184230.00	Xuất tuần 3 cho Nhà máy bao bì Tân Phú	[]	
T0457	M006		P0004	2024-03-20	2024-03-20 17:00:00	usage	6.179	22845499.00	0.0	141162338.32	0.00	141162338.32	Xuất tuần 3 cho Xưởng cơ khí Bình Dương	[]	
T0458	M013		P0005	2024-03-20	2024-03-20 14:00:00	usage	12111.000	19153.00	0.0	231961983.00	0.00	231961983.00	Xuất tuần 3 cho Trung tâm phân phối An Sương	[]	
T0459	M014		P0006	2024-03-16	2024-03-16 17:00:00	usage	7501.000	25784.00	0.0	193405784.00	0.00	193405784.00	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T0460	M014	S0022		2024-03-22	2024-03-22 11:00:00	purchase	2826.000	27089.00	10.0	76553514.00	7655351.40	84208865.40	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0461	M014		P0006	2024-03-24	2024-03-24 10:00:00	usage	1102.000	26176.00	0.0	28845952.00	0.00	28845952.00	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T0462	M017		P0004	2024-03-25	2024-03-25 17:00:00	usage	2069.000	41767.00	0.0	86415923.00	0.00	86415923.00	Xuất tuần 4 cho Xưởng cơ khí Bình Dương	[]	
T0463	M017	S0022		2024-03-31	2024-03-31 09:00:00	purchase	3949.000	42658.00	10.0	168456442.00	16845644.20	185302086.20	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0464	M017		P0004	2024-03-31	2024-03-31 13:00:00	usage	1880.000	42034.00	0.0	79023920.00	0.00	79023920.00	Xuất tiếp sau nhập bù cho Xưởng cơ khí Bình Dương	[]	
T0465	M012		P0005	2024-03-24	2024-03-24 13:00:00	usage	2855.000	73186.00	0.0	208946030.00	0.00	208946030.00	Xuất tuần 4 cho Trung tâm phân phối An Sương	[]	
T0466	M014		P0006	2024-03-23	2024-03-23 11:00:00	usage	1724.000	26176.00	0.0	45127424.00	0.00	45127424.00	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T0467	M014	S0024		2024-03-27	2024-03-27 08:00:00	purchase	4806.000	27252.00	10.0	130973112.00	13097311.20	144070423.20	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0468	M014		P0006	2024-03-29	2024-03-29 16:00:00	usage	1499.000	26499.00	0.0	39722001.00	0.00	39722001.00	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T0469	M018		P0007	2024-03-28	2024-03-28 11:00:00	usage	39.000	1555323.00	0.0	60657597.00	0.00	60657597.00	Xuất tuần 4 cho Kho thép Phú Mỹ	[]	
T0470	M018	S0025		2024-03-31	2024-03-31 12:00:00	purchase	144.000	1629018.00	10.0	234578592.00	23457859.20	258036451.20	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0471	M018		P0007	2024-03-31	2024-03-31 11:00:00	usage	43.000	1577431.00	0.0	67829533.00	0.00	67829533.00	Xuất tiếp sau nhập bù cho Kho thép Phú Mỹ	[]	
T0472	M012	S0006		2024-04-08	2024-04-08 11:00:00	purchase	6542.000	72835.00	10.0	476486570.00	47648657.00	524135227.00	Nhập kế hoạch tuần đầu tháng 4/2024	[]	
T0473	M008	S0009		2024-04-02	2024-04-02 09:00:00	purchase	22.764	26237127.00	10.0	597261959.03	59726195.90	656988154.93	Nhập kế hoạch tuần đầu tháng 4/2024	[]	
T0474	M020	S0021		2024-04-04	2024-04-04 09:00:00	purchase	4274.000	133212.00	10.0	569348088.00	56934808.80	626282896.80	Nhập kế hoạch tuần đầu tháng 4/2024	[]	
T0475	M003	S0027		2024-04-02	2024-04-02 15:00:00	purchase	13.477	24170489.00	10.0	325745680.25	32574568.03	358320248.28	Nhập kế hoạch tuần đầu tháng 4/2024	[]	
T0476	M015	S0030		2024-04-03	2024-04-03 15:00:00	purchase	12850.000	49857.00	10.0	640662450.00	64066245.00	704728695.00	Nhập kế hoạch tuần đầu tháng 4/2024	[]	
T0477	M003		P0040	2024-04-03	2024-04-03 09:00:00	usage	11.508	23972158.00	0.0	275871594.26	0.00	275871594.26	Xuất tuần 1 cho Xưởng sản xuất container module	[]	
T0478	M008		P0001	2024-04-05	2024-04-05 17:00:00	usage	5.369	26172242.00	0.0	140518767.30	0.00	140518767.30	Xuất tuần 1 cho Nhà xưởng Sunrise Long An	[]	
T0479	M002		P0002	2024-04-07	2024-04-07 17:00:00	usage	6.344	25346157.00	0.0	160796020.01	0.00	160796020.01	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T0480	M012		P0003	2024-04-13	2024-04-13 17:00:00	usage	3090.000	73098.00	0.0	225872820.00	0.00	225872820.00	Xuất tuần 2 cho Nhà máy bao bì Tân Phú	[]	
T0481	M014		P0004	2024-04-09	2024-04-09 09:00:00	usage	3307.000	26499.00	0.0	87632193.00	0.00	87632193.00	Xuất tuần 2 cho Xưởng cơ khí Bình Dương	[]	
T0482	M014	S0024		2024-04-11	2024-04-11 13:00:00	purchase	6735.000	28663.00	10.0	193045305.00	19304530.50	212349835.50	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0483	M014		P0004	2024-04-14	2024-04-14 17:00:00	usage	3629.000	27148.00	0.0	98520092.00	0.00	98520092.00	Xuất tiếp sau nhập bù cho Xưởng cơ khí Bình Dương	[]	
T0484	M002		P0005	2024-04-11	2024-04-11 17:00:00	usage	3.761	25346157.00	0.0	95326896.48	0.00	95326896.48	Xuất tuần 2 cho Trung tâm phân phối An Sương	[]	
T0485	M012		P0006	2024-04-14	2024-04-14 12:00:00	usage	2620.000	73098.00	0.0	191516760.00	0.00	191516760.00	Xuất tuần 2 cho Nhà máy thực phẩm GreenFarm	[]	
T0486	M002		P0007	2024-04-11	2024-04-11 14:00:00	usage	7.605	25346157.00	0.0	192757523.99	0.00	192757523.99	Xuất tuần 2 cho Kho thép Phú Mỹ	[]	
T0487	M003		P0006	2024-04-17	2024-04-17 13:00:00	usage	9.002	23972158.00	0.0	215797366.32	0.00	215797366.32	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T0488	M010		P0007	2024-04-19	2024-04-19 12:00:00	usage	9.403	25282178.00	0.0	237728319.73	0.00	237728319.73	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T0489	M015		P0008	2024-04-17	2024-04-17 10:00:00	usage	4902.000	49375.00	0.0	242036250.00	0.00	242036250.00	Xuất tuần 3 cho Nhà xưởng may Phước Đông	[]	
T0490	M015		P0009	2024-04-19	2024-04-19 15:00:00	usage	3178.000	49375.00	0.0	156913750.00	0.00	156913750.00	Xuất tuần 3 cho Nhà máy nhựa Nam Việt	[]	
T0491	M018		P0010	2024-04-20	2024-04-20 11:00:00	usage	101.000	1577431.00	0.0	159320531.00	0.00	159320531.00	Xuất tuần 3 cho Khu bảo trì xe buýt Củ Chi	[]	
T0492	M018	S0002		2024-04-28	2024-04-28 13:00:00	purchase	99.000	1614088.00	10.0	159794712.00	15979471.20	175774183.20	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0493	M018		P0010	2024-04-30	2024-04-30 11:00:00	usage	44.000	1588428.00	0.0	69890832.00	0.00	69890832.00	Xuất tiếp sau nhập bù cho Khu bảo trì xe buýt Củ Chi	[]	
T0494	M012		P0009	2024-04-27	2024-04-27 17:00:00	usage	1824.000	73098.00	0.0	133330752.00	0.00	133330752.00	Xuất tuần 4 cho Nhà máy nhựa Nam Việt	[]	
T0495	M020		P0010	2024-04-24	2024-04-24 13:00:00	usage	1694.000	130775.00	0.0	221532850.00	0.00	221532850.00	Xuất tuần 4 cho Khu bảo trì xe buýt Củ Chi	[]	
T0496	M001		P0011	2024-04-25	2024-04-25 17:00:00	usage	11.359	24775756.00	0.0	281427812.40	0.00	281427812.40	Xuất tuần 4 cho Nhà máy gỗ Đức Hòa	[]	
T0497	M001	S0005		2024-04-30	2024-04-30 13:00:00	purchase	8.986	24878363.00	10.0	223556969.92	22355696.99	245912666.91	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T0498	M001		P0011	2024-04-30	2024-04-30 16:00:00	usage	0.091	24806538.00	0.0	2257394.96	0.00	2257394.96	Xuất tiếp sau nhập bù cho Nhà máy gỗ Đức Hòa	[]	
T0499	M018		P0012	2024-04-26	2024-04-26 15:00:00	usage	55.000	1588428.00	0.0	87363540.00	0.00	87363540.00	Xuất tuần 4 cho Kho tổng hợp Sóng Thần	[]	
T0500	M018	S0006		2024-04-29	2024-04-29 13:00:00	purchase	195.000	1669584.00	10.0	325568880.00	32556888.00	358125768.00	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0501	M018		P0012	2024-04-30	2024-04-30 12:00:00	usage	78.000	1612775.00	0.0	125796450.00	0.00	125796450.00	Xuất tiếp sau nhập bù cho Kho tổng hợp Sóng Thần	[]	
T0502	M003		P0013	2024-04-25	2024-04-25 09:00:00	usage	12.898	23972158.00	0.0	309192893.88	0.00	309192893.88	Xuất tuần 4 cho Nhà xưởng điện tử VSIP	[]	
T0503	M002	S0013		2024-05-06	2024-05-06 12:00:00	purchase	13.216	24029844.00	8.0	317578418.30	25406273.46	342984691.77	Nhập theo chu kỳ dài Thép hình H300x300x10x15 tháng 5/2024	[]	
T0504	M012	S0001		2024-05-07	2024-05-07 10:00:00	purchase	6983.000	73928.00	10.0	516239224.00	51623922.40	567863146.40	Nhập kế hoạch tuần đầu tháng 5/2024	[]	
T0505	M016	S0007		2024-05-08	2024-05-08 13:00:00	purchase	4497.000	51425.00	10.0	231258225.00	23125822.50	254384047.50	Nhập kế hoạch tuần đầu tháng 5/2024	[]	
T0506	M017	S0010		2024-05-03	2024-05-03 13:00:00	purchase	9147.000	40865.00	10.0	373792155.00	37379215.50	411171370.50	Nhập kế hoạch tuần đầu tháng 5/2024	[]	
T0507	M003	S0013		2024-05-02	2024-05-02 10:00:00	purchase	17.309	23528809.00	10.0	407260154.98	40726015.50	447986170.48	Nhập kế hoạch tuần đầu tháng 5/2024	[]	
T0508	M006		P0005	2024-05-04	2024-05-04 17:00:00	usage	11.437	22845499.00	0.0	261283972.06	0.00	261283972.06	Xuất tuần 1 cho Trung tâm phân phối An Sương	[]	
T0509	M016		P0006	2024-05-04	2024-05-04 12:00:00	usage	3167.000	51898.00	0.0	164360966.00	0.00	164360966.00	Xuất tuần 1 cho Nhà máy thực phẩm GreenFarm	[]	
T0510	M015		P0007	2024-05-07	2024-05-07 17:00:00	usage	4476.000	49375.00	0.0	221002500.00	0.00	221002500.00	Xuất tuần 1 cho Kho thép Phú Mỹ	[]	
T0511	M017		P0008	2024-05-06	2024-05-06 14:00:00	usage	6154.000	41742.00	0.0	256880268.00	0.00	256880268.00	Xuất tuần 1 cho Nhà xưởng may Phước Đông	[]	
T0512	M013		P0009	2024-05-04	2024-05-04 16:00:00	usage	3648.000	19153.00	0.0	69870144.00	0.00	69870144.00	Xuất tuần 1 cho Nhà máy nhựa Nam Việt	[]	
T0513	M013	S0003		2024-05-09	2024-05-09 09:00:00	purchase	14898.000	21364.00	10.0	318280872.00	31828087.20	350108959.20	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0514	M013		P0009	2024-05-10	2024-05-10 11:00:00	usage	5436.000	19816.00	0.0	107719776.00	0.00	107719776.00	Xuất tiếp sau nhập bù cho Nhà máy nhựa Nam Việt	[]	
T0515	M012		P0010	2024-05-05	2024-05-05 16:00:00	usage	2662.000	73306.00	0.0	195140572.00	0.00	195140572.00	Xuất tuần 1 cho Khu bảo trì xe buýt Củ Chi	[]	
T0516	M006		P0008	2024-05-09	2024-05-09 09:00:00	usage	3.430	22845499.00	0.0	78360061.57	0.00	78360061.57	Xuất tuần 2 cho Nhà xưởng may Phước Đông	[]	
T0517	M015		P0009	2024-05-14	2024-05-14 10:00:00	usage	2631.000	49375.00	0.0	129905625.00	0.00	129905625.00	Xuất tuần 2 cho Nhà máy nhựa Nam Việt	[]	
T0518	M015	S0005		2024-05-19	2024-05-19 10:00:00	purchase	299.000	49694.00	10.0	14858506.00	1485850.60	16344356.60	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0519	M015		P0009	2024-05-21	2024-05-21 16:00:00	usage	33.000	49471.00	0.0	1632543.00	0.00	1632543.00	Xuất tiếp sau nhập bù cho Nhà máy nhựa Nam Việt	[]	
T0520	M008		P0010	2024-05-13	2024-05-13 09:00:00	usage	4.596	26172242.00	0.0	120287624.23	0.00	120287624.23	Xuất tuần 2 cho Khu bảo trì xe buýt Củ Chi	[]	
T0521	M020		P0011	2024-05-14	2024-05-14 12:00:00	usage	1416.000	130775.00	0.0	185177400.00	0.00	185177400.00	Xuất tuần 2 cho Nhà máy gỗ Đức Hòa	[]	
T0522	M002		P0012	2024-05-12	2024-05-12 12:00:00	usage	4.611	25017079.00	0.0	115353751.27	0.00	115353751.27	Xuất tuần 2 cho Kho tổng hợp Sóng Thần	[]	
T0523	M012		P0013	2024-05-10	2024-05-10 17:00:00	usage	1877.000	73306.00	0.0	137595362.00	0.00	137595362.00	Xuất tuần 2 cho Nhà xưởng điện tử VSIP	[]	
T0524	M013		P0011	2024-05-18	2024-05-18 09:00:00	usage	8178.000	19816.00	0.0	162055248.00	0.00	162055248.00	Xuất tuần 3 cho Nhà máy gỗ Đức Hòa	[]	
T0525	M001		P0012	2024-05-18	2024-05-18 14:00:00	usage	5.997	24806538.00	0.0	148764808.39	0.00	148764808.39	Xuất tuần 3 cho Kho tổng hợp Sóng Thần	[]	
T0526	M002		P0013	2024-05-17	2024-05-17 15:00:00	usage	3.232	25017079.00	0.0	80855199.33	0.00	80855199.33	Xuất tuần 3 cho Nhà xưởng điện tử VSIP	[]	
T0527	M020		P0014	2024-05-21	2024-05-21 16:00:00	usage	790.000	130775.00	0.0	103312250.00	0.00	103312250.00	Xuất tuần 3 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0528	M015		P0015	2024-05-17	2024-05-17 09:00:00	usage	266.000	49471.00	0.0	13159286.00	0.00	13159286.00	Xuất tuần 3 cho Kho hàng cảng Cát Lái	[]	
T0529	M015	S0013		2024-05-22	2024-05-22 11:00:00	purchase	6353.000	49496.00	10.0	314448088.00	31444808.80	345892896.80	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0530	M015		P0015	2024-05-23	2024-05-23 14:00:00	usage	1961.000	49479.00	0.0	97028319.00	0.00	97028319.00	Xuất tiếp sau nhập bù cho Kho hàng cảng Cát Lái	[]	
T0531	M002		P0016	2024-05-21	2024-05-21 16:00:00	usage	4.693	25017079.00	0.0	117405151.75	0.00	117405151.75	Xuất tuần 3 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0532	M008		P0014	2024-05-28	2024-05-28 17:00:00	usage	5.026	26172242.00	0.0	131541688.29	0.00	131541688.29	Xuất tuần 4 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0533	M003		P0015	2024-05-24	2024-05-24 11:00:00	usage	5.561	23861321.00	0.0	132692806.08	0.00	132692806.08	Xuất tuần 4 cho Kho hàng cảng Cát Lái	[]	
T0534	M006		P0016	2024-05-27	2024-05-27 14:00:00	usage	2.388	22845499.00	0.0	54555051.61	0.00	54555051.61	Xuất tuần 4 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0535	M006	S0016		2024-05-31	2024-05-31 10:00:00	purchase	11.062	24193683.00	10.0	267630521.35	26763052.13	294393573.48	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 10mm	[]	
T0536	M006		P0016	2024-05-31	2024-05-31 09:00:00	usage	0.234	23249954.00	0.0	5440489.24	0.00	5440489.24	Xuất tiếp sau nhập bù cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0537	M015	S0023		2024-06-07	2024-06-07 15:00:00	purchase	14433.000	48394.00	10.0	698470602.00	69847060.20	768317662.20	Nhập kế hoạch tuần đầu tháng 6/2024	[]	
T0538	M020	S0029		2024-06-04	2024-06-04 14:00:00	purchase	4402.000	133616.00	8.0	588177632.00	47054210.56	635231842.56	Nhập kế hoạch tuần đầu tháng 6/2024	[]	
T0539	M013	S0011		2024-06-04	2024-06-04 09:00:00	purchase	27791.000	21233.00	10.0	590086303.00	59008630.30	649094933.30	Nhập kế hoạch tuần đầu tháng 6/2024	[]	
T0540	M012	S0014		2024-06-08	2024-06-08 10:00:00	purchase	10570.000	69791.00	10.0	737690870.00	73769087.00	811459957.00	Nhập kế hoạch tuần đầu tháng 6/2024	[]	
T0541	M009	S0017		2024-06-01	2024-06-01 11:00:00	purchase	30.266	26272238.00	8.0	795155555.31	63612444.42	858767999.73	Nhập kế hoạch tuần đầu tháng 6/2024	[]	
T0542	M001	S0023		2024-06-08	2024-06-08 11:00:00	purchase	32.749	26132250.00	10.0	855805055.25	85580505.53	941385560.78	Nhập kế hoạch tuần đầu tháng 6/2024	[]	
T0543	M019		P0010	2024-06-04	2024-06-04 16:00:00	usage	25.000	1947989.00	0.0	48699725.00	0.00	48699725.00	Xuất tuần 1 cho Khu bảo trì xe buýt Củ Chi	[]	
T0544	M019	S0010		2024-06-10	2024-06-10 10:00:00	purchase	204.000	1935512.00	10.0	394844448.00	39484444.80	434328892.80	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0545	M019		P0010	2024-06-11	2024-06-11 14:00:00	usage	73.000	1944246.00	0.0	141929958.00	0.00	141929958.00	Xuất tiếp sau nhập bù cho Khu bảo trì xe buýt Củ Chi	[]	
T0546	M020		P0011	2024-06-06	2024-06-06 15:00:00	usage	2552.000	131485.00	0.0	335549720.00	0.00	335549720.00	Xuất tuần 1 cho Nhà máy gỗ Đức Hòa	[]	
T0547	M001		P0012	2024-06-07	2024-06-07 13:00:00	usage	8.831	25137966.00	0.0	221993377.75	0.00	221993377.75	Xuất tuần 1 cho Kho tổng hợp Sóng Thần	[]	
T0548	M008		P0013	2024-06-05	2024-06-05 17:00:00	usage	5.327	26172242.00	0.0	139419533.13	0.00	139419533.13	Xuất tuần 1 cho Nhà xưởng điện tử VSIP	[]	
T0549	M005		P0014	2024-06-03	2024-06-03 15:00:00	usage	12.595	23068638.00	0.0	290549495.61	0.00	290549495.61	Xuất tuần 1 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0550	M016		P0015	2024-06-02	2024-06-02 12:00:00	usage	6566.000	51898.00	0.0	340762268.00	0.00	340762268.00	Xuất tuần 1 cho Kho hàng cảng Cát Lái	[]	
T0551	M008		P0013	2024-06-10	2024-06-10 16:00:00	usage	7.724	26172242.00	0.0	202154397.21	0.00	202154397.21	Xuất tuần 2 cho Nhà xưởng điện tử VSIP	[]	
T0552	M017		P0014	2024-06-14	2024-06-14 09:00:00	usage	5062.000	41742.00	0.0	211298004.00	0.00	211298004.00	Xuất tuần 2 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0553	M017	S0016		2024-06-22	2024-06-22 08:00:00	purchase	445.000	41132.00	10.0	18303740.00	1830374.00	20134114.00	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0554	M017		P0014	2024-06-24	2024-06-24 15:00:00	usage	174.000	41559.00	0.0	7231266.00	0.00	7231266.00	Xuất tiếp sau nhập bù cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0555	M013		P0015	2024-06-14	2024-06-14 09:00:00	usage	7510.000	20170.00	0.0	151476700.00	0.00	151476700.00	Xuất tuần 2 cho Kho hàng cảng Cát Lái	[]	
T0556	M002		P0016	2024-06-14	2024-06-14 15:00:00	usage	4.086	25017079.00	0.0	102219784.79	0.00	102219784.79	Xuất tuần 2 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0557	M019		P0017	2024-06-11	2024-06-11 14:00:00	usage	113.000	1944246.00	0.0	219699798.00	0.00	219699798.00	Xuất tuần 2 cho Nhà máy dược phẩm Tân Uyên	[]	
T0558	M013		P0016	2024-06-16	2024-06-16 17:00:00	usage	14753.000	20170.00	0.0	297568010.00	0.00	297568010.00	Xuất tuần 3 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0559	M014		P0017	2024-06-20	2024-06-20 12:00:00	usage	3106.000	27148.00	0.0	84321688.00	0.00	84321688.00	Xuất tuần 3 cho Nhà máy dược phẩm Tân Uyên	[]	
T0560	M014	S0021		2024-06-27	2024-06-27 13:00:00	purchase	5959.000	26488.00	10.0	157841992.00	15784199.20	173626191.20	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0561	M014		P0017	2024-06-28	2024-06-28 12:00:00	usage	3552.000	26950.00	0.0	95726400.00	0.00	95726400.00	Xuất tiếp sau nhập bù cho Nhà máy dược phẩm Tân Uyên	[]	
T0562	M012		P0018	2024-06-17	2024-06-17 16:00:00	usage	5768.000	72427.00	0.0	417758936.00	0.00	417758936.00	Xuất tuần 3 cho Trạm logistics Nhơn Trạch	[]	
T0563	M013		P0019	2024-06-19	2024-06-19 17:00:00	usage	6812.000	20170.00	0.0	137398040.00	0.00	137398040.00	Xuất tuần 3 cho Nhà xưởng cơ điện Quận 12	[]	
T0564	M013	S0023		2024-06-23	2024-06-23 09:00:00	purchase	24360.000	21071.00	10.0	513289560.00	51328956.00	564618516.00	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0565	M013		P0019	2024-06-26	2024-06-26 15:00:00	usage	7133.000	20440.00	0.0	145798520.00	0.00	145798520.00	Xuất tiếp sau nhập bù cho Nhà xưởng cơ điện Quận 12	[]	
T0566	M013		P0019	2024-06-25	2024-06-25 16:00:00	usage	9109.000	20440.00	0.0	186187960.00	0.00	186187960.00	Xuất tuần 4 cho Nhà xưởng cơ điện Quận 12	[]	
T0567	M020		P0020	2024-06-26	2024-06-26 12:00:00	usage	746.000	131485.00	0.0	98087810.00	0.00	98087810.00	Xuất tuần 4 cho Kho nguyên liệu Bến Lức	[]	
T0568	M019		P0021	2024-06-26	2024-06-26 17:00:00	usage	18.000	1944246.00	0.0	34996428.00	0.00	34996428.00	Xuất tuần 4 cho Nhà máy giấy Mỹ Phước	[]	
T0569	M019	S0027		2024-06-29	2024-06-29 09:00:00	purchase	155.000	1879448.00	10.0	291314440.00	29131444.00	320445884.00	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0570	M019		P0021	2024-06-30	2024-06-30 13:00:00	usage	60.000	1924807.00	0.0	115488420.00	0.00	115488420.00	Xuất tiếp sau nhập bù cho Nhà máy giấy Mỹ Phước	[]	
T0571	M008		P0022	2024-06-23	2024-06-23 09:00:00	usage	6.535	26172242.00	0.0	171035601.47	0.00	171035601.47	Xuất tuần 4 cho Xưởng lắp ráp xe điện	[]	
T0572	M001		P0010	2024-06-26	2024-06-26 15:00:00	return	4.452	25137966.00	0.0	111914224.63	0.00	111914224.63	Trả vật tư dư cuối tháng từ Khu bảo trì xe buýt Củ Chi	[]	
T0573	M001	S0027		2024-07-05	2024-07-05 08:00:00	purchase	12.105	26022342.00	10.0	315000449.91	31500044.99	346500494.90	Nhập kế hoạch tuần đầu tháng 7/2024	[]	
T0574	M002	S0003		2024-07-05	2024-07-05 10:00:00	purchase	10.083	25488912.00	10.0	257004699.70	25700469.97	282705169.67	Nhập theo chu kỳ dài Thép hình H300x300x10x15 tháng 7/2024	[]	
T0575	M019	S0009		2024-07-06	2024-07-06 14:00:00	purchase	160.000	1830410.00	10.0	292865600.00	29286560.00	322152160.00	Nhập theo chu kỳ dài Sơn phủ polyurethane xanh tháng 7/2024	[]	
T0576	M015	S0018		2024-07-01	2024-07-01 09:00:00	purchase	5760.000	47495.00	10.0	273571200.00	27357120.00	300928320.00	Nhập kế hoạch tuần đầu tháng 7/2024	[]	
T0577	M019		P0015	2024-07-04	2024-07-04 16:00:00	usage	55.000	1901208.00	0.0	104566440.00	0.00	104566440.00	Xuất tuần 1 cho Kho hàng cảng Cát Lái	[]	
T0578	M013		P0016	2024-07-07	2024-07-07 12:00:00	usage	2132.000	20440.00	0.0	43578080.00	0.00	43578080.00	Xuất tuần 1 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0579	M015		P0017	2024-07-03	2024-07-03 14:00:00	usage	1592.000	48780.00	0.0	77657760.00	0.00	77657760.00	Xuất tuần 1 cho Nhà máy dược phẩm Tân Uyên	[]	
T0580	M009		P0018	2024-07-02	2024-07-02 10:00:00	usage	2.739	25612846.00	0.0	70153585.19	0.00	70153585.19	Xuất tuần 1 cho Trạm logistics Nhơn Trạch	[]	
T0581	M015		P0019	2024-07-07	2024-07-07 16:00:00	usage	1951.000	48780.00	0.0	95169780.00	0.00	95169780.00	Xuất tuần 1 cho Nhà xưởng cơ điện Quận 12	[]	
T0582	M008		P0020	2024-07-02	2024-07-02 17:00:00	usage	1.869	26172242.00	0.0	48915920.30	0.00	48915920.30	Xuất tuần 1 cho Kho nguyên liệu Bến Lức	[]	
T0583	M019		P0018	2024-07-12	2024-07-12 09:00:00	usage	54.000	1901208.00	0.0	102665232.00	0.00	102665232.00	Xuất tuần 2 cho Trạm logistics Nhơn Trạch	[]	
T0584	M005		P0019	2024-07-14	2024-07-14 11:00:00	usage	3.106	23068638.00	0.0	71651189.63	0.00	71651189.63	Xuất tuần 2 cho Nhà xưởng cơ điện Quận 12	[]	
T0585	M005		P0020	2024-07-13	2024-07-13 10:00:00	usage	4.920	23068638.00	0.0	113497698.96	0.00	113497698.96	Xuất tuần 2 cho Kho nguyên liệu Bến Lức	[]	
T0586	M001		P0021	2024-07-09	2024-07-09 11:00:00	usage	3.893	25359060.00	0.0	98722820.58	0.00	98722820.58	Xuất tuần 2 cho Nhà máy giấy Mỹ Phước	[]	
T0587	M015		P0021	2024-07-16	2024-07-16 16:00:00	usage	2214.000	48780.00	0.0	107998920.00	0.00	107998920.00	Xuất tuần 3 cho Nhà máy giấy Mỹ Phước	[]	
T0588	M002		P0022	2024-07-21	2024-07-21 11:00:00	usage	5.533	25135037.00	0.0	139072159.72	0.00	139072159.72	Xuất tuần 3 cho Xưởng lắp ráp xe điện	[]	
T0589	M013		P0023	2024-07-21	2024-07-21 09:00:00	usage	3221.000	20440.00	0.0	65837240.00	0.00	65837240.00	Xuất tuần 3 cho Nhà máy nước giải khát Tây Ninh	[]	
T0590	M008		P0024	2024-07-26	2024-07-26 12:00:00	usage	3.303	26172242.00	0.0	86446915.33	0.00	86446915.33	Xuất tuần 4 cho Kho phân phối Bình Chánh	[]	
T0591	M018		P0025	2024-07-25	2024-07-25 13:00:00	usage	56.000	1612775.00	0.0	90315400.00	0.00	90315400.00	Xuất tuần 4 cho Nhà máy sơn Long Thành	[]	
T0592	M008		P0026	2024-07-26	2024-07-26 12:00:00	usage	2.399	26172242.00	0.0	62787208.56	0.00	62787208.56	Xuất tuần 4 cho Xưởng bao bì carton Cần Giuộc	[]	
T0593	M008		P0027	2024-07-24	2024-07-24 09:00:00	usage	2.908	26172242.00	0.0	76108879.74	0.00	76108879.74	Xuất tuần 4 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0594	M008	S0007		2024-08-04	2024-08-04 10:00:00	purchase	9.270	27243194.00	10.0	252544408.38	25254440.84	277798849.22	Nhập kế hoạch tuần đầu tháng 8/2024	[]	
T0595	M012	S0013		2024-08-07	2024-08-07 12:00:00	purchase	5908.000	76129.00	8.0	449770132.00	35981610.56	485751742.56	Nhập kế hoạch tuần đầu tháng 8/2024	[]	
T0596	M015	S0025		2024-08-06	2024-08-06 13:00:00	purchase	3538.000	46926.00	10.0	166024188.00	16602418.80	182626606.80	Nhập kế hoạch tuần đầu tháng 8/2024	[]	
T0597	M017	S0001		2024-08-05	2024-08-05 14:00:00	purchase	5060.000	39506.00	10.0	199900360.00	19990036.00	219890396.00	Nhập kế hoạch tuần đầu tháng 8/2024	[]	
T0598	M008		P0020	2024-08-05	2024-08-05 12:00:00	usage	5.661	26439980.00	0.0	149676726.78	0.00	149676726.78	Xuất tuần 1 cho Kho nguyên liệu Bến Lức	[]	
T0599	M008		P0021	2024-08-06	2024-08-06 15:00:00	usage	5.050	26439980.00	0.0	133521899.00	0.00	133521899.00	Xuất tuần 1 cho Nhà máy giấy Mỹ Phước	[]	
T0600	M004		P0022	2024-08-02	2024-08-02 14:00:00	usage	4.637	23298270.00	0.0	108034077.99	0.00	108034077.99	Xuất tuần 1 cho Xưởng lắp ráp xe điện	[]	
T0601	M002		P0023	2024-08-05	2024-08-05 12:00:00	usage	5.199	25135037.00	0.0	130677057.36	0.00	130677057.36	Xuất tuần 1 cho Nhà máy nước giải khát Tây Ninh	[]	
T0602	M004		P0023	2024-08-10	2024-08-10 17:00:00	usage	2.987	23298270.00	0.0	69591932.49	0.00	69591932.49	Xuất tuần 2 cho Nhà máy nước giải khát Tây Ninh	[]	
T0603	M005		P0024	2024-08-11	2024-08-11 12:00:00	usage	3.379	23068638.00	0.0	77948927.80	0.00	77948927.80	Xuất tuần 2 cho Kho phân phối Bình Chánh	[]	
T0604	M008		P0025	2024-08-11	2024-08-11 10:00:00	usage	1.686	26439980.00	0.0	44577806.28	0.00	44577806.28	Xuất tuần 2 cho Nhà máy sơn Long Thành	[]	
T0605	M008		P0026	2024-08-14	2024-08-14 15:00:00	usage	2.999	26439980.00	0.0	79293500.02	0.00	79293500.02	Xuất tuần 2 cho Xưởng bao bì carton Cần Giuộc	[]	
T0606	M005		P0027	2024-08-09	2024-08-09 13:00:00	usage	4.214	23068638.00	0.0	97211240.53	0.00	97211240.53	Xuất tuần 2 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0607	M003		P0028	2024-08-12	2024-08-12 12:00:00	usage	4.648	23861321.00	0.0	110907420.01	0.00	110907420.01	Xuất tuần 2 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0608	M008		P0026	2024-08-21	2024-08-21 09:00:00	usage	5.883	26439980.00	0.0	155546402.34	0.00	155546402.34	Xuất tuần 3 cho Xưởng bao bì carton Cần Giuộc	[]	
T0609	M004		P0027	2024-08-19	2024-08-19 09:00:00	usage	5.616	23298270.00	0.0	130843084.32	0.00	130843084.32	Xuất tuần 3 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0610	M004		P0028	2024-08-16	2024-08-16 13:00:00	usage	6.622	23298270.00	0.0	154281143.94	0.00	154281143.94	Xuất tuần 3 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0611	M005		P0029	2024-08-19	2024-08-19 14:00:00	usage	3.329	23068638.00	0.0	76795495.90	0.00	76795495.90	Xuất tuần 3 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0612	M002		P0029	2024-08-25	2024-08-25 13:00:00	usage	2.786	25135037.00	0.0	70026213.08	0.00	70026213.08	Xuất tuần 4 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0613	M002	S0017		2024-08-31	2024-08-31 12:00:00	purchase	5.006	27250960.00	10.0	136418305.76	13641830.58	150060136.34	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0614	M002		P0029	2024-08-31	2024-08-31 09:00:00	usage	1.018	25769814.00	0.0	26233670.65	0.00	26233670.65	Xuất tiếp sau nhập bù cho Nhà xưởng phụ trợ Dĩ An	[]	
T0615	M002		P0030	2024-08-23	2024-08-23 15:00:00	usage	3.005	25769814.00	0.0	77438291.07	0.00	77438291.07	Xuất tuần 4 cho Trung tâm vận hành Đức Trọng	[]	
T0616	M015		P0031	2024-08-23	2024-08-23 10:00:00	usage	2531.000	48317.00	0.0	122290327.00	0.00	122290327.00	Xuất tuần 4 cho Nhà máy phân bón Long An	[]	
T0617	M005		P0032	2024-08-27	2024-08-27 14:00:00	usage	5.286	23068638.00	0.0	121940820.47	0.00	121940820.47	Xuất tuần 4 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0618	M009	S0011		2024-09-05	2024-09-05 15:00:00	purchase	11.912	25674731.00	8.0	305837395.67	24466991.65	330304387.33	Nhập kế hoạch tuần đầu tháng 9/2024	[]	
T0619	M004	S0029		2024-09-03	2024-09-03 11:00:00	purchase	10.139	22490092.00	10.0	228027042.79	22802704.28	250829747.07	Nhập kế hoạch tuần đầu tháng 9/2024	[]	
T0620	M018	S0005		2024-09-07	2024-09-07 08:00:00	purchase	323.000	1664128.00	10.0	537513344.00	53751334.40	591264678.40	Nhập kế hoạch tuần đầu tháng 9/2024	[]	
T0621	M005	S0017		2024-09-05	2024-09-05 08:00:00	purchase	14.930	22657210.00	8.0	338272145.30	27061771.62	365333916.92	Nhập kế hoạch tuần đầu tháng 9/2024	[]	
T0622	M020		P0025	2024-09-07	2024-09-07 11:00:00	usage	637.000	131485.00	0.0	83755945.00	0.00	83755945.00	Xuất tuần 1 cho Nhà máy sơn Long Thành	[]	
T0623	M002		P0026	2024-09-03	2024-09-03 10:00:00	usage	0.983	25769814.00	0.0	25331727.16	0.00	25331727.16	Xuất tuần 1 cho Xưởng bao bì carton Cần Giuộc	[]	
T0624	M002	S0014		2024-09-11	2024-09-11 12:00:00	purchase	18.749	25933897.00	10.0	486234634.85	48623463.49	534858098.34	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0625	M002		P0026	2024-09-12	2024-09-12 13:00:00	usage	2.214	25819039.00	0.0	57163352.35	0.00	57163352.35	Xuất tiếp sau nhập bù cho Xưởng bao bì carton Cần Giuộc	[]	
T0626	M020		P0027	2024-09-03	2024-09-03 13:00:00	usage	884.000	131485.00	0.0	116232740.00	0.00	116232740.00	Xuất tuần 1 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0627	M012		P0028	2024-09-02	2024-09-02 10:00:00	usage	2105.000	73353.00	0.0	154408065.00	0.00	154408065.00	Xuất tuần 1 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0628	M010		P0028	2024-09-10	2024-09-10 16:00:00	usage	6.571	25282178.00	0.0	166129191.64	0.00	166129191.64	Xuất tuần 2 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0629	M012		P0029	2024-09-10	2024-09-10 11:00:00	usage	2493.000	73353.00	0.0	182869029.00	0.00	182869029.00	Xuất tuần 2 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0630	M007		P0030	2024-09-13	2024-09-13 11:00:00	usage	3.577	23894376.00	0.0	85470182.95	0.00	85470182.95	Xuất tuần 2 cho Trung tâm vận hành Đức Trọng	[]	
T0631	M007	S0020		2024-09-18	2024-09-18 11:00:00	purchase	18.500	24698395.00	10.0	456920307.50	45692030.75	502612338.25	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T0632	M007		P0030	2024-09-20	2024-09-20 10:00:00	usage	4.152	24135582.00	0.0	100210936.46	0.00	100210936.46	Xuất tiếp sau nhập bù cho Trung tâm vận hành Đức Trọng	[]	
T0633	M018		P0031	2024-09-14	2024-09-14 11:00:00	usage	145.000	1625613.00	0.0	235713885.00	0.00	235713885.00	Xuất tuần 2 cho Nhà máy phân bón Long An	[]	
T0634	M004		P0032	2024-09-09	2024-09-09 13:00:00	usage	8.626	23096226.00	0.0	199228045.48	0.00	199228045.48	Xuất tuần 2 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0635	M008		P0033	2024-09-09	2024-09-09 13:00:00	usage	3.699	26439980.00	0.0	97801486.02	0.00	97801486.02	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T0636	M005		P0031	2024-09-18	2024-09-18 15:00:00	usage	6.880	22965781.00	0.0	158004573.28	0.00	158004573.28	Xuất tuần 3 cho Nhà máy phân bón Long An	[]	
T0637	M011		P0032	2024-09-17	2024-09-17 16:00:00	usage	4.920	26725519.00	0.0	131489553.48	0.00	131489553.48	Xuất tuần 3 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0638	M011	S0024		2024-09-21	2024-09-21 12:00:00	purchase	8.387	27039516.00	10.0	226780420.69	22678042.07	249458462.76	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0639	M011		P0032	2024-09-22	2024-09-22 17:00:00	usage	0.786	26819718.00	0.0	21080298.35	0.00	21080298.35	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0640	M006		P0033	2024-09-16	2024-09-16 14:00:00	usage	5.639	23249954.00	0.0	131106490.61	0.00	131106490.61	Xuất tuần 3 cho Nhà xưởng sản xuất pallet	[]	
T0641	M002		P0034	2024-09-20	2024-09-20 14:00:00	usage	4.439	25819039.00	0.0	114610714.12	0.00	114610714.12	Xuất tuần 3 cho Nhà máy nông sản Cái Bè	[]	
T0642	M006		P0035	2024-09-16	2024-09-16 11:00:00	usage	5.189	23249954.00	0.0	120644011.31	0.00	120644011.31	Xuất tuần 3 cho Xưởng gia công thép Thủ Đức	[]	
T0643	M006	S0027		2024-09-18	2024-09-18 08:00:00	purchase	5.686	22946746.00	10.0	130475197.76	13047519.78	143522717.53	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 10mm	[]	
T0644	M006		P0035	2024-09-21	2024-09-21 14:00:00	usage	0.320	23158992.00	0.0	7410877.44	0.00	7410877.44	Xuất tiếp sau nhập bù cho Xưởng gia công thép Thủ Đức	[]	
T0645	M018		P0036	2024-09-19	2024-09-19 11:00:00	usage	105.000	1625613.00	0.0	170689365.00	0.00	170689365.00	Xuất tuần 3 cho Kho ngoại quan Hiệp Phước	[]	
T0646	M002		P0034	2024-09-24	2024-09-24 12:00:00	usage	6.560	25819039.00	0.0	169372895.84	0.00	169372895.84	Xuất tuần 4 cho Nhà máy nông sản Cái Bè	[]	
T0647	M010		P0035	2024-09-24	2024-09-24 12:00:00	usage	2.971	25282178.00	0.0	75113350.84	0.00	75113350.84	Xuất tuần 4 cho Xưởng gia công thép Thủ Đức	[]	
T0648	M018		P0036	2024-09-25	2024-09-25 14:00:00	usage	57.000	1625613.00	0.0	92659941.00	0.00	92659941.00	Xuất tuần 4 cho Kho ngoại quan Hiệp Phước	[]	
T0649	M017		P0037	2024-09-24	2024-09-24 13:00:00	usage	3234.000	41046.00	0.0	132742764.00	0.00	132742764.00	Xuất tuần 4 cho Nhà máy điện mặt trời phụ trợ	[]	
T0650	M016	S0006		2024-10-03	2024-10-03 08:00:00	purchase	9993.000	53491.00	10.0	534535563.00	53453556.30	587989119.30	Nhập kế hoạch tuần đầu tháng 10/2024	[]	
T0651	M006	S0009		2024-10-03	2024-10-03 11:00:00	purchase	18.481	23940549.00	10.0	442445286.07	44244528.61	486689814.68	Nhập kế hoạch tuần đầu tháng 10/2024	[]	
T0652	M013		P0030	2024-10-04	2024-10-04 13:00:00	usage	2765.000	20440.00	0.0	56516600.00	0.00	56516600.00	Xuất tuần 1 cho Trung tâm vận hành Đức Trọng	[]	
T0653	M013	S0024		2024-10-08	2024-10-08 12:00:00	purchase	6768.000	21877.00	10.0	148063536.00	14806353.60	162869889.60	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0654	M013		P0030	2024-10-10	2024-10-10 13:00:00	usage	3682.000	20871.00	0.0	76847022.00	0.00	76847022.00	Xuất tiếp sau nhập bù cho Trung tâm vận hành Đức Trọng	[]	
T0655	M004		P0031	2024-10-07	2024-10-07 14:00:00	usage	8.106	23096226.00	0.0	187218007.96	0.00	187218007.96	Xuất tuần 1 cho Nhà máy phân bón Long An	[]	
T0656	M010		P0032	2024-10-05	2024-10-05 09:00:00	usage	7.397	25282178.00	0.0	187012270.67	0.00	187012270.67	Xuất tuần 1 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0657	M003		P0033	2024-10-13	2024-10-13 12:00:00	usage	3.934	23861321.00	0.0	93870436.81	0.00	93870436.81	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T0658	M004		P0034	2024-10-12	2024-10-12 10:00:00	usage	1.836	23096226.00	0.0	42404670.94	0.00	42404670.94	Xuất tuần 2 cho Nhà máy nông sản Cái Bè	[]	
T0659	M004	S0030		2024-10-17	2024-10-17 09:00:00	purchase	19.472	24837836.00	10.0	483642342.59	48364234.26	532006576.85	Nhập bù sau khi gần cạn tồn Thép U200x75x8.5	[]	
T0660	M004		P0034	2024-10-18	2024-10-18 09:00:00	usage	5.072	23618709.00	0.0	119794092.05	0.00	119794092.05	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T0661	M006		P0035	2024-10-13	2024-10-13 09:00:00	usage	3.266	23354381.00	0.0	76275408.35	0.00	76275408.35	Xuất tuần 2 cho Xưởng gia công thép Thủ Đức	[]	
T0662	M014		P0036	2024-10-16	2024-10-16 12:00:00	usage	2407.000	26950.00	0.0	64868650.00	0.00	64868650.00	Xuất tuần 3 cho Kho ngoại quan Hiệp Phước	[]	
T0663	M014	S0004		2024-10-20	2024-10-20 10:00:00	purchase	20433.000	28246.00	10.0	577150518.00	57715051.80	634865569.80	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0664	M014		P0036	2024-10-23	2024-10-23 15:00:00	usage	7767.000	27339.00	0.0	212342013.00	0.00	212342013.00	Xuất tiếp sau nhập bù cho Kho ngoại quan Hiệp Phước	[]	
T0665	M007		P0037	2024-10-17	2024-10-17 10:00:00	usage	8.316	24135582.00	0.0	200711499.91	0.00	200711499.91	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T0666	M010		P0038	2024-10-17	2024-10-17 17:00:00	usage	11.298	25282178.00	0.0	285638047.04	0.00	285638047.04	Xuất tuần 3 cho Trung tâm bảo trì thiết bị	[]	
T0667	M006		P0039	2024-10-28	2024-10-28 10:00:00	usage	5.314	23354381.00	0.0	124105180.63	0.00	124105180.63	Xuất tuần 4 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0668	M004		P0040	2024-10-26	2024-10-26 15:00:00	usage	2.449	23618709.00	0.0	57842218.34	0.00	57842218.34	Xuất tuần 4 cho Xưởng sản xuất container module	[]	
T0669	M013		P0001	2024-10-27	2024-10-27 13:00:00	usage	3086.000	20871.00	0.0	64407906.00	0.00	64407906.00	Xuất tuần 4 cho Nhà xưởng Sunrise Long An	[]	
T0670	M013	S0011		2024-10-30	2024-10-30 13:00:00	purchase	4654.000	23321.00	10.0	108535934.00	10853593.40	119389527.40	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0671	M013		P0001	2024-10-31	2024-10-31 11:00:00	usage	1414.000	21606.00	0.0	30550884.00	0.00	30550884.00	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T0672	M009	S0025		2024-11-03	2024-11-03 08:00:00	purchase	6.721	27038639.00	10.0	181726692.72	18172669.27	199899361.99	Nhập kế hoạch tuần đầu tháng 11/2024	[]	
T0673	M017	S0004		2024-11-02	2024-11-02 08:00:00	purchase	6426.000	42369.00	10.0	272263194.00	27226319.40	299489513.40	Nhập kế hoạch tuần đầu tháng 11/2024	[]	
T0674	M002	S0013		2024-11-02	2024-11-02 14:00:00	purchase	10.174	27760040.00	10.0	282430646.96	28243064.70	310673711.66	Nhập theo chu kỳ dài Thép hình H300x300x10x15 tháng 11/2024	[]	
T0675	M005	S0022		2024-11-06	2024-11-06 10:00:00	purchase	9.471	24595117.00	8.0	232940353.11	18635228.25	251575581.36	Nhập kế hoạch tuần đầu tháng 11/2024	[]	
T0676	M009		P0035	2024-11-03	2024-11-03 13:00:00	usage	1.158	25980898.00	0.0	30085879.88	0.00	30085879.88	Xuất tuần 1 cho Xưởng gia công thép Thủ Đức	[]	
T0677	M017		P0036	2024-11-02	2024-11-02 09:00:00	usage	1229.000	41377.00	0.0	50852333.00	0.00	50852333.00	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T0678	M011		P0037	2024-11-02	2024-11-02 16:00:00	usage	7.601	26819718.00	0.0	203856676.52	0.00	203856676.52	Xuất tuần 1 cho Nhà máy điện mặt trời phụ trợ	[]	
T0679	M011	S0007		2024-11-11	2024-11-11 11:00:00	purchase	11.781	27213244.00	10.0	320599227.56	32059922.76	352659150.32	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0680	M011		P0037	2024-11-12	2024-11-12 15:00:00	usage	2.662	26937776.00	0.0	71708359.71	0.00	71708359.71	Xuất tiếp sau nhập bù cho Nhà máy điện mặt trời phụ trợ	[]	
T0681	M017		P0038	2024-11-14	2024-11-14 10:00:00	usage	3043.000	41377.00	0.0	125910211.00	0.00	125910211.00	Xuất tuần 2 cho Trung tâm bảo trì thiết bị	[]	
T0682	M019		P0039	2024-11-10	2024-11-10 14:00:00	usage	57.000	1901208.00	0.0	108368856.00	0.00	108368856.00	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0683	M008		P0040	2024-11-09	2024-11-09 14:00:00	usage	2.702	26439980.00	0.0	71440825.96	0.00	71440825.96	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T0684	M002		P0001	2024-11-11	2024-11-11 14:00:00	usage	3.035	26304289.00	0.0	79833517.12	0.00	79833517.12	Xuất tuần 2 cho Nhà xưởng Sunrise Long An	[]	
T0685	M011		P0002	2024-11-14	2024-11-14 17:00:00	usage	9.119	26937776.00	0.0	245645579.34	0.00	245645579.34	Xuất tuần 2 cho Kho lạnh Mekong Logistics	[]	
T0686	M011	S0014		2024-11-19	2024-11-19 10:00:00	purchase	15.324	26718178.00	10.0	409429359.67	40942935.97	450372295.64	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0687	M011		P0002	2024-11-20	2024-11-20 15:00:00	usage	3.786	26871897.00	0.0	101737002.04	0.00	101737002.04	Xuất tiếp sau nhập bù cho Kho lạnh Mekong Logistics	[]	
T0688	M003		P0001	2024-11-19	2024-11-19 11:00:00	usage	4.546	23861321.00	0.0	108473565.27	0.00	108473565.27	Xuất tuần 3 cho Nhà xưởng Sunrise Long An	[]	
T0689	M009		P0002	2024-11-19	2024-11-19 09:00:00	usage	3.844	25980898.00	0.0	99870571.91	0.00	99870571.91	Xuất tuần 3 cho Kho lạnh Mekong Logistics	[]	
T0690	M005		P0003	2024-11-20	2024-11-20 10:00:00	usage	19.946	23373115.00	0.0	466200151.79	0.00	466200151.79	Xuất tuần 3 cho Nhà máy bao bì Tân Phú	[]	
T0691	M005	S0017		2024-11-29	2024-11-29 08:00:00	purchase	22.524	23154804.00	10.0	521538805.30	52153880.53	573692685.83	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 6mm	[]	
T0692	M005		P0003	2024-11-30	2024-11-30 09:00:00	usage	8.402	23307622.00	0.0	195830640.04	0.00	195830640.04	Xuất tiếp sau nhập bù cho Nhà máy bao bì Tân Phú	[]	
T0693	M001		P0004	2024-11-27	2024-11-27 10:00:00	usage	1.698	25359060.00	0.0	43059683.88	0.00	43059683.88	Xuất tuần 4 cho Xưởng cơ khí Bình Dương	[]	
T0694	M008		P0005	2024-11-24	2024-11-24 09:00:00	usage	1.938	26439980.00	0.0	51240681.24	0.00	51240681.24	Xuất tuần 4 cho Trung tâm phân phối An Sương	[]	
T0695	M003		P0006	2024-11-28	2024-11-28 13:00:00	usage	1.544	23861321.00	0.0	36841879.62	0.00	36841879.62	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T0696	M019		P0007	2024-11-27	2024-11-27 16:00:00	usage	25.000	1901208.00	0.0	47530200.00	0.00	47530200.00	Xuất tuần 4 cho Kho thép Phú Mỹ	[]	
T0697	M017		P0008	2024-11-26	2024-11-26 12:00:00	usage	4251.000	41377.00	0.0	175893627.00	0.00	175893627.00	Xuất tuần 4 cho Nhà xưởng may Phước Đông	[]	
T0698	M017	S0024		2024-11-30	2024-11-30 13:00:00	purchase	316.000	44002.00	10.0	13904632.00	1390463.20	15295095.20	Nhập bù sau khi gần cạn tồn Đá cắt inox 355mm	[]	
T0699	M017		P0008	2024-11-30	2024-11-30 14:00:00	usage	96.000	42165.00	0.0	4047840.00	0.00	4047840.00	Xuất tiếp sau nhập bù cho Nhà xưởng may Phước Đông	[]	
T0700	M016	S0008		2024-12-08	2024-12-08 13:00:00	purchase	9241.000	52940.00	10.0	489218540.00	48921854.00	538140394.00	Nhập kế hoạch tuần đầu tháng 12/2024	[]	
T0701	M006	S0011		2024-12-03	2024-12-03 10:00:00	purchase	9.829	23719249.00	10.0	233136498.42	23313649.84	256450148.26	Nhập kế hoạch tuần đầu tháng 12/2024	[]	
T0702	M015	S0017		2024-12-04	2024-12-04 10:00:00	purchase	3910.000	45445.00	8.0	177689950.00	14215196.00	191905146.00	Nhập kế hoạch tuần đầu tháng 12/2024	[]	
T0703	M017	S0023		2024-12-02	2024-12-02 08:00:00	purchase	4942.000	41409.00	10.0	204643278.00	20464327.80	225107605.80	Nhập kế hoạch tuần đầu tháng 12/2024	[]	
T0704	M010	S0005		2024-12-01	2024-12-01 11:00:00	purchase	9.288	24112382.00	10.0	223955804.02	22395580.40	246351384.42	Nhập kế hoạch tuần đầu tháng 12/2024	[]	
T0705	M013		P0040	2024-12-07	2024-12-07 15:00:00	usage	3240.000	21606.00	0.0	70003440.00	0.00	70003440.00	Xuất tuần 1 cho Xưởng sản xuất container module	[]	
T0706	M013	S0016		2024-12-14	2024-12-14 11:00:00	purchase	4821.000	23823.00	10.0	114850683.00	11485068.30	126335751.30	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0707	M013		P0040	2024-12-15	2024-12-15 10:00:00	usage	2850.000	22271.00	0.0	63472350.00	0.00	63472350.00	Xuất tiếp sau nhập bù cho Xưởng sản xuất container module	[]	
T0708	M019		P0001	2024-12-06	2024-12-06 11:00:00	usage	47.000	1901208.00	0.0	89356776.00	0.00	89356776.00	Xuất tuần 1 cho Nhà xưởng Sunrise Long An	[]	
T0709	M019		P0002	2024-12-06	2024-12-06 11:00:00	usage	17.000	1901208.00	0.0	32320536.00	0.00	32320536.00	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T0710	M019	S0018		2024-12-09	2024-12-09 13:00:00	purchase	124.000	1963728.00	10.0	243502272.00	24350227.20	267852499.20	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0711	M019		P0002	2024-12-12	2024-12-12 15:00:00	usage	34.000	1919964.00	0.0	65278776.00	0.00	65278776.00	Xuất tiếp sau nhập bù cho Kho lạnh Mekong Logistics	[]	
T0712	M010		P0003	2024-12-09	2024-12-09 12:00:00	usage	3.835	24989729.00	0.0	95835610.72	0.00	95835610.72	Xuất tuần 2 cho Nhà máy bao bì Tân Phú	[]	
T0713	M019		P0004	2024-12-09	2024-12-09 13:00:00	usage	24.000	1919964.00	0.0	46079136.00	0.00	46079136.00	Xuất tuần 2 cho Xưởng cơ khí Bình Dương	[]	
T0714	M015		P0005	2024-12-13	2024-12-13 11:00:00	usage	992.000	47599.00	0.0	47218208.00	0.00	47218208.00	Xuất tuần 2 cho Trung tâm phân phối An Sương	[]	
T0715	M012		P0006	2024-12-16	2024-12-16 15:00:00	usage	2436.000	73353.00	0.0	178687908.00	0.00	178687908.00	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T0716	M013		P0007	2024-12-19	2024-12-19 13:00:00	usage	1971.000	22271.00	0.0	43896141.00	0.00	43896141.00	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T0717	M013	S0027		2024-12-26	2024-12-26 14:00:00	purchase	11432.000	24699.00	10.0	282358968.00	28235896.80	310594864.80	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0718	M013		P0007	2024-12-29	2024-12-29 16:00:00	usage	3813.000	22999.00	0.0	87695187.00	0.00	87695187.00	Xuất tiếp sau nhập bù cho Kho thép Phú Mỹ	[]	
T0719	M006		P0008	2024-12-19	2024-12-19 16:00:00	usage	8.607	23445598.00	0.0	201796261.99	0.00	201796261.99	Xuất tuần 3 cho Nhà xưởng may Phước Đông	[]	
T0720	M017		P0009	2024-12-18	2024-12-18 14:00:00	usage	3612.000	41976.00	0.0	151617312.00	0.00	151617312.00	Xuất tuần 3 cho Nhà máy nhựa Nam Việt	[]	
T0721	M012		P0010	2024-12-16	2024-12-16 10:00:00	usage	1549.000	73353.00	0.0	113623797.00	0.00	113623797.00	Xuất tuần 3 cho Khu bảo trì xe buýt Củ Chi	[]	
T0722	M001		P0009	2024-12-26	2024-12-26 17:00:00	usage	5.288	25359060.00	0.0	134098709.28	0.00	134098709.28	Xuất tuần 4 cho Nhà máy nhựa Nam Việt	[]	
T0723	M006		P0010	2024-12-27	2024-12-27 12:00:00	usage	4.110	23445598.00	0.0	96361407.78	0.00	96361407.78	Xuất tuần 4 cho Khu bảo trì xe buýt Củ Chi	[]	
T0724	M002		P0011	2024-12-24	2024-12-24 14:00:00	usage	3.211	26304289.00	0.0	84463071.98	0.00	84463071.98	Xuất tuần 4 cho Nhà máy gỗ Đức Hòa	[]	
T0725	M002	S0016		2025-01-02	2025-01-02 14:00:00	purchase	4.718	27335556.00	8.0	128969153.21	10317532.26	139286685.46	Nhập theo chu kỳ dài Thép hình H300x300x10x15 tháng 1/2025	[]	
T0726	M008	S0019		2025-01-08	2025-01-08 14:00:00	purchase	6.546	28224883.00	10.0	184760084.12	18476008.41	203236092.53	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0727	M015	S0022		2025-01-03	2025-01-03 08:00:00	purchase	3291.000	49376.00	10.0	162496416.00	16249641.60	178746057.60	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0728	M009	S0025		2025-01-04	2025-01-04 15:00:00	purchase	7.325	27794015.00	10.0	203591159.88	20359115.99	223950275.86	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0729	M017	S0028		2025-01-03	2025-01-03 10:00:00	purchase	6064.000	44523.00	10.0	269987472.00	26998747.20	296986219.20	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0730	M001	S0001		2025-01-08	2025-01-08 11:00:00	purchase	8.745	25582207.00	10.0	223716400.21	22371640.02	246088040.24	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0731	M020	S0004		2025-01-02	2025-01-02 15:00:00	purchase	1874.000	135803.00	8.0	254494822.00	20359585.76	274854407.76	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0732	M016	S0007		2025-01-03	2025-01-03 09:00:00	purchase	4782.000	55050.00	10.0	263249100.00	26324910.00	289574010.00	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0733	M018	S0010		2025-01-05	2025-01-05 11:00:00	purchase	112.000	1638164.00	8.0	183474368.00	14677949.44	198152317.44	Nhập kế hoạch tuần đầu tháng 1/2025	[]	
T0734	M015		P0026	2025-01-04	2025-01-04 10:00:00	usage	945.000	48043.00	0.0	45400635.00	0.00	45400635.00	Xuất tuần 1 cho Xưởng bao bì carton Cần Giuộc	[]	
T0735	M018		P0027	2025-01-07	2025-01-07 12:00:00	usage	61.000	1628751.00	0.0	99353811.00	0.00	99353811.00	Xuất tuần 1 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0736	M015		P0028	2025-01-04	2025-01-04 16:00:00	usage	1804.000	48043.00	0.0	86669572.00	0.00	86669572.00	Xuất tuần 1 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0737	M009		P0029	2025-01-07	2025-01-07 10:00:00	usage	3.176	26434177.00	0.0	83954946.15	0.00	83954946.15	Xuất tuần 1 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0738	M017		P0030	2025-01-02	2025-01-02 11:00:00	usage	1421.000	42613.00	0.0	60553073.00	0.00	60553073.00	Xuất tuần 1 cho Trung tâm vận hành Đức Trọng	[]	
T0739	M001		P0031	2025-01-05	2025-01-05 12:00:00	usage	2.067	25414847.00	0.0	52532488.75	0.00	52532488.75	Xuất tuần 1 cho Nhà máy phân bón Long An	[]	
T0740	M020		P0029	2025-01-13	2025-01-13 17:00:00	usage	670.000	132565.00	0.0	88818550.00	0.00	88818550.00	Xuất tuần 2 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0741	M002		P0030	2025-01-12	2025-01-12 15:00:00	usage	1.633	26562106.00	0.0	43375919.10	0.00	43375919.10	Xuất tuần 2 cho Trung tâm vận hành Đức Trọng	[]	
T0742	M002		P0031	2025-01-14	2025-01-14 11:00:00	usage	4.024	26562106.00	0.0	106885914.54	0.00	106885914.54	Xuất tuần 2 cho Nhà máy phân bón Long An	[]	
T0743	M015		P0032	2025-01-13	2025-01-13 16:00:00	usage	1066.000	48043.00	0.0	51213838.00	0.00	51213838.00	Xuất tuần 2 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0744	M020		P0033	2025-01-11	2025-01-11 10:00:00	usage	777.000	132565.00	0.0	103003005.00	0.00	103003005.00	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T0745	M020		P0032	2025-01-16	2025-01-16 15:00:00	usage	625.000	132565.00	0.0	82853125.00	0.00	82853125.00	Xuất tuần 3 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0746	M017		P0033	2025-01-19	2025-01-19 17:00:00	usage	2446.000	42613.00	0.0	104231398.00	0.00	104231398.00	Xuất tuần 3 cho Nhà xưởng sản xuất pallet	[]	
T0747	M001		P0034	2025-01-19	2025-01-19 14:00:00	usage	2.567	25414847.00	0.0	65239912.25	0.00	65239912.25	Xuất tuần 3 cho Nhà máy nông sản Cái Bè	[]	
T0748	M020		P0035	2025-01-19	2025-01-19 10:00:00	usage	610.000	132565.00	0.0	80864650.00	0.00	80864650.00	Xuất tuần 3 cho Xưởng gia công thép Thủ Đức	[]	
T0749	M020	S0029		2025-01-21	2025-01-21 14:00:00	purchase	750.000	133922.00	10.0	100441500.00	10044150.00	110485650.00	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T0750	M020		P0035	2025-01-23	2025-01-23 14:00:00	usage	152.000	132972.00	0.0	20211744.00	0.00	20211744.00	Xuất tiếp sau nhập bù cho Xưởng gia công thép Thủ Đức	[]	
T0751	M002		P0036	2025-01-17	2025-01-17 14:00:00	usage	4.964	26562106.00	0.0	131854294.18	0.00	131854294.18	Xuất tuần 3 cho Kho ngoại quan Hiệp Phước	[]	
T0752	M020		P0037	2025-01-20	2025-01-20 15:00:00	usage	598.000	132972.00	0.0	79517256.00	0.00	79517256.00	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T0753	M020	S0001		2025-01-28	2025-01-28 12:00:00	purchase	1535.000	128515.00	10.0	197270525.00	19727052.50	216997577.50	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T0754	M020		P0037	2025-01-30	2025-01-30 14:00:00	usage	483.000	131635.00	0.0	63579705.00	0.00	63579705.00	Xuất tiếp sau nhập bù cho Nhà máy điện mặt trời phụ trợ	[]	
T0755	M001		P0035	2025-01-26	2025-01-26 14:00:00	usage	2.314	25414847.00	0.0	58809955.96	0.00	58809955.96	Xuất tuần 4 cho Xưởng gia công thép Thủ Đức	[]	
T0756	M001		P0036	2025-01-24	2025-01-24 09:00:00	usage	3.407	25414847.00	0.0	86588383.73	0.00	86588383.73	Xuất tuần 4 cho Kho ngoại quan Hiệp Phước	[]	
T0757	M001		P0037	2025-01-27	2025-01-27 11:00:00	usage	3.548	25414847.00	0.0	90171877.16	0.00	90171877.16	Xuất tuần 4 cho Nhà máy điện mặt trời phụ trợ	[]	
T0758	M008		P0038	2025-01-24	2025-01-24 10:00:00	usage	4.218	26886206.00	0.0	113406016.91	0.00	113406016.91	Xuất tuần 4 cho Trung tâm bảo trì thiết bị	[]	
T0759	M008		P0026	2025-01-22	2025-01-22 15:00:00	return	1.340	26886206.00	0.0	36027516.04	0.00	36027516.04	Trả vật tư dư cuối tháng từ Xưởng bao bì carton Cần Giuộc	[]	
T0760	M008	S0023		2025-02-01	2025-02-01 15:00:00	purchase	11.063	26182494.00	10.0	289656931.12	28965693.11	318622624.23	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0761	M005	S0026		2025-02-04	2025-02-04 08:00:00	purchase	5.827	24431538.00	10.0	142362571.93	14236257.19	156598829.12	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0762	M003	S0029		2025-02-04	2025-02-04 12:00:00	purchase	12.574	23304423.00	10.0	293029814.80	29302981.48	322332796.28	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0763	M017	S0008		2025-02-08	2025-02-08 13:00:00	purchase	4685.000	41650.00	10.0	195130250.00	19513025.00	214643275.00	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0764	M010	S0011		2025-02-04	2025-02-04 08:00:00	purchase	13.490	26584726.00	10.0	358627953.74	35862795.37	394490749.11	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0765	M009	S0017		2025-02-04	2025-02-04 11:00:00	purchase	11.104	25096862.00	10.0	278675555.65	27867555.56	306543111.21	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0766	M001	S0020		2025-02-06	2025-02-06 10:00:00	purchase	6.741	26497362.00	10.0	178618717.24	17861871.72	196480588.97	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0767	M012	S0023		2025-02-03	2025-02-03 09:00:00	purchase	3340.000	77232.00	10.0	257954880.00	25795488.00	283750368.00	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0768	M004	S0026		2025-02-02	2025-02-02 10:00:00	purchase	13.006	24320497.00	10.0	316312383.98	31631238.40	347943622.38	Nhập kế hoạch tuần đầu tháng 2/2025	[]	
T0769	M002		P0031	2025-02-05	2025-02-05 15:00:00	usage	1.983	26562106.00	0.0	52672656.20	0.00	52672656.20	Xuất tuần 1 cho Nhà máy phân bón Long An	[]	
T0770	M010		P0032	2025-02-03	2025-02-03 17:00:00	usage	2.505	25388478.00	0.0	63598137.39	0.00	63598137.39	Xuất tuần 1 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0771	M009		P0033	2025-02-04	2025-02-04 15:00:00	usage	3.820	26099848.00	0.0	99701419.36	0.00	99701419.36	Xuất tuần 1 cho Nhà xưởng sản xuất pallet	[]	
T0772	M003		P0034	2025-02-05	2025-02-05 15:00:00	usage	2.358	23722097.00	0.0	55936704.73	0.00	55936704.73	Xuất tuần 1 cho Nhà máy nông sản Cái Bè	[]	
T0773	M004		P0035	2025-02-07	2025-02-07 17:00:00	usage	2.863	23794156.00	0.0	68122668.63	0.00	68122668.63	Xuất tuần 1 cho Xưởng gia công thép Thủ Đức	[]	
T0774	M005		P0034	2025-02-13	2025-02-13 09:00:00	usage	1.711	23588601.00	0.0	40360096.31	0.00	40360096.31	Xuất tuần 2 cho Nhà máy nông sản Cái Bè	[]	
T0775	M004		P0035	2025-02-13	2025-02-13 16:00:00	usage	3.163	23794156.00	0.0	75260915.43	0.00	75260915.43	Xuất tuần 2 cho Xưởng gia công thép Thủ Đức	[]	
T0776	M019		P0036	2025-02-11	2025-02-11 15:00:00	usage	38.000	1919964.00	0.0	72958632.00	0.00	72958632.00	Xuất tuần 2 cho Kho ngoại quan Hiệp Phước	[]	
T0777	M010		P0037	2025-02-17	2025-02-17 14:00:00	usage	4.169	25388478.00	0.0	105844564.78	0.00	105844564.78	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T0778	M010		P0038	2025-02-16	2025-02-16 13:00:00	usage	4.967	25388478.00	0.0	126104570.23	0.00	126104570.23	Xuất tuần 3 cho Trung tâm bảo trì thiết bị	[]	
T0779	M009		P0039	2025-02-18	2025-02-18 14:00:00	usage	5.279	26099848.00	0.0	137781097.59	0.00	137781097.59	Xuất tuần 3 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0780	M014		P0040	2025-02-17	2025-02-17 13:00:00	usage	3526.000	27339.00	0.0	96397314.00	0.00	96397314.00	Xuất tuần 3 cho Xưởng sản xuất container module	[]	
T0781	M008		P0040	2025-02-28	2025-02-28 17:00:00	usage	4.083	26710278.00	0.0	109058065.07	0.00	109058065.07	Xuất tuần 4 cho Xưởng sản xuất container module	[]	
T0782	M017		P0001	2025-02-25	2025-02-25 14:00:00	usage	2662.000	42372.00	0.0	112794264.00	0.00	112794264.00	Xuất tuần 4 cho Nhà xưởng Sunrise Long An	[]	
T0783	M012		P0002	2025-02-24	2025-02-24 10:00:00	usage	912.000	74323.00	0.0	67782576.00	0.00	67782576.00	Xuất tuần 4 cho Kho lạnh Mekong Logistics	[]	
T0784	M002		P0003	2025-02-24	2025-02-24 12:00:00	usage	1.578	26562106.00	0.0	41915003.27	0.00	41915003.27	Xuất tuần 4 cho Nhà máy bao bì Tân Phú	[]	
T0785	M002	S0015		2025-02-28	2025-02-28 14:00:00	purchase	17.455	27912058.00	10.0	487204972.39	48720497.24	535925469.63	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0786	M002		P0003	2025-02-28	2025-02-28 13:00:00	usage	3.275	26967092.00	0.0	88317226.30	0.00	88317226.30	Xuất tiếp sau nhập bù cho Nhà máy bao bì Tân Phú	[]	
T0787	M005		P0004	2025-02-25	2025-02-25 11:00:00	usage	4.883	23588601.00	0.0	115183138.68	0.00	115183138.68	Xuất tuần 4 cho Xưởng cơ khí Bình Dương	[]	
T0788	M014		P0031	2025-02-25	2025-02-25 15:00:00	return	125.000	27339.00	0.0	3417375.00	0.00	3417375.00	Trả vật tư dư cuối tháng từ Nhà máy phân bón Long An	[]	
T0789	M020	S0003		2025-03-07	2025-03-07 11:00:00	purchase	5095.000	125199.00	10.0	637888905.00	63788890.50	701677795.50	Nhập kế hoạch tuần đầu tháng 3/2025	[]	
T0790	M008	S0009		2025-03-08	2025-03-08 11:00:00	purchase	18.086	27234671.00	10.0	492566259.71	49256625.97	541822885.68	Nhập kế hoạch tuần đầu tháng 3/2025	[]	
T0791	M017	S0015		2025-03-03	2025-03-03 14:00:00	purchase	8290.000	42218.00	10.0	349987220.00	34998722.00	384985942.00	Nhập kế hoạch tuần đầu tháng 3/2025	[]	
T0792	M010	S0021		2025-03-08	2025-03-08 15:00:00	purchase	10.393	25344574.00	10.0	263406157.58	26340615.76	289746773.34	Nhập kế hoạch tuần đầu tháng 3/2025	[]	
T0793	M005	S0030		2025-03-07	2025-03-07 15:00:00	purchase	16.014	22820782.00	8.0	365452002.95	29236160.24	394688163.18	Nhập kế hoạch tuần đầu tháng 3/2025	[]	
T0794	M016		P0036	2025-03-02	2025-03-02 09:00:00	usage	5047.000	53105.00	0.0	268020935.00	0.00	268020935.00	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T0795	M016		P0037	2025-03-04	2025-03-04 16:00:00	usage	5995.000	53105.00	0.0	318364475.00	0.00	318364475.00	Xuất tuần 1 cho Nhà máy điện mặt trời phụ trợ	[]	
T0796	M020		P0038	2025-03-05	2025-03-05 17:00:00	usage	2177.000	130026.00	0.0	283066602.00	0.00	283066602.00	Xuất tuần 1 cho Trung tâm bảo trì thiết bị	[]	
T0797	M016		P0039	2025-03-12	2025-03-12 17:00:00	usage	3624.000	53105.00	0.0	192452520.00	0.00	192452520.00	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0798	M014		P0040	2025-03-14	2025-03-14 12:00:00	usage	4589.000	27339.00	0.0	125458671.00	0.00	125458671.00	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T0799	M014		P0001	2025-03-13	2025-03-13 15:00:00	usage	4676.000	27339.00	0.0	127837164.00	0.00	127837164.00	Xuất tuần 2 cho Nhà xưởng Sunrise Long An	[]	
T0800	M014	S0015		2025-03-22	2025-03-22 14:00:00	purchase	967.000	27883.00	10.0	26962861.00	2696286.10	29659147.10	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0801	M014		P0001	2025-03-25	2025-03-25 12:00:00	usage	406.000	27502.00	0.0	11165812.00	0.00	11165812.00	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T0802	M009		P0002	2025-03-11	2025-03-11 16:00:00	usage	6.238	26099848.00	0.0	162810851.82	0.00	162810851.82	Xuất tuần 2 cho Kho lạnh Mekong Logistics	[]	
T0803	M005		P0003	2025-03-11	2025-03-11 14:00:00	usage	3.633	23396646.00	0.0	85000014.92	0.00	85000014.92	Xuất tuần 2 cho Nhà máy bao bì Tân Phú	[]	
T0804	M010		P0004	2025-03-12	2025-03-12 09:00:00	usage	7.095	25377502.00	0.0	180053376.69	0.00	180053376.69	Xuất tuần 2 cho Xưởng cơ khí Bình Dương	[]	
T0805	M009		P0002	2025-03-16	2025-03-16 11:00:00	usage	5.136	26099848.00	0.0	134048819.33	0.00	134048819.33	Xuất tuần 3 cho Kho lạnh Mekong Logistics	[]	
T0806	M004		P0003	2025-03-20	2025-03-20 15:00:00	usage	8.727	23794156.00	0.0	207651599.41	0.00	207651599.41	Xuất tuần 3 cho Nhà máy bao bì Tân Phú	[]	
T0807	M017		P0004	2025-03-21	2025-03-21 14:00:00	usage	4670.000	42334.00	0.0	197699780.00	0.00	197699780.00	Xuất tuần 3 cho Xưởng cơ khí Bình Dương	[]	
T0808	M017		P0005	2025-03-18	2025-03-18 10:00:00	usage	2224.000	42334.00	0.0	94150816.00	0.00	94150816.00	Xuất tuần 3 cho Trung tâm phân phối An Sương	[]	
T0809	M006		P0006	2025-03-18	2025-03-18 17:00:00	usage	5.847	23445598.00	0.0	137086411.51	0.00	137086411.51	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T0810	M007		P0007	2025-03-19	2025-03-19 11:00:00	usage	6.032	24135582.00	0.0	145585830.62	0.00	145585830.62	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T0811	M007	S0023		2025-03-25	2025-03-25 09:00:00	purchase	14.050	25906137.00	10.0	363981224.85	36398122.49	400379347.34	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T0812	M007		P0007	2025-03-26	2025-03-26 14:00:00	usage	0.276	24666749.00	0.0	6808022.72	0.00	6808022.72	Xuất tiếp sau nhập bù cho Kho thép Phú Mỹ	[]	
T0813	M003		P0005	2025-03-28	2025-03-28 12:00:00	usage	6.282	23722097.00	0.0	149022213.35	0.00	149022213.35	Xuất tuần 4 cho Trung tâm phân phối An Sương	[]	
T0814	M006		P0006	2025-03-23	2025-03-23 13:00:00	usage	6.323	23445598.00	0.0	148246516.15	0.00	148246516.15	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T0815	M007		P0007	2025-03-24	2025-03-24 17:00:00	usage	8.737	24666749.00	0.0	215513386.01	0.00	215513386.01	Xuất tuần 4 cho Kho thép Phú Mỹ	[]	
T0816	M020		P0008	2025-03-27	2025-03-27 12:00:00	usage	925.000	130026.00	0.0	120274050.00	0.00	120274050.00	Xuất tuần 4 cho Nhà xưởng may Phước Đông	[]	
T0817	M015		P0009	2025-03-28	2025-03-28 16:00:00	usage	3667.000	48043.00	0.0	176173681.00	0.00	176173681.00	Xuất tuần 4 cho Nhà máy nhựa Nam Việt	[]	
T0818	M010		P0036	2025-03-24	2025-03-24 15:00:00	return	3.618	25377502.00	0.0	91815802.24	0.00	91815802.24	Trả vật tư dư cuối tháng từ Kho ngoại quan Hiệp Phước	[]	
T0819	M015	S0007		2025-04-03	2025-04-03 08:00:00	purchase	11074.000	45429.00	10.0	503080746.00	50308074.60	553388820.60	Nhập kế hoạch tuần đầu tháng 4/2025	[]	
T0820	M006	S0019		2025-04-05	2025-04-05 09:00:00	purchase	25.532	24388642.00	10.0	622690807.54	62269080.75	684959888.30	Nhập kế hoạch tuần đầu tháng 4/2025	[]	
T0821	M008	S0028		2025-04-07	2025-04-07 14:00:00	purchase	19.234	28321047.00	10.0	544727018.00	54472701.80	599199719.80	Nhập kế hoạch tuần đầu tháng 4/2025	[]	
T0822	M020	S0007		2025-04-08	2025-04-08 12:00:00	purchase	5140.000	123118.00	8.0	632826520.00	50626121.60	683452641.60	Nhập kế hoạch tuần đầu tháng 4/2025	[]	
T0823	M001		P0001	2025-04-06	2025-04-06 13:00:00	usage	4.591	25685476.00	0.0	117922020.32	0.00	117922020.32	Xuất tuần 1 cho Nhà xưởng Sunrise Long An	[]	
T0824	M001		P0002	2025-04-03	2025-04-03 16:00:00	usage	4.319	25685476.00	0.0	110935570.84	0.00	110935570.84	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T0825	M014		P0003	2025-04-02	2025-04-02 09:00:00	usage	561.000	27502.00	0.0	15428622.00	0.00	15428622.00	Xuất tuần 1 cho Nhà máy bao bì Tân Phú	[]	
T0826	M014	S0021		2025-04-10	2025-04-10 14:00:00	purchase	8983.000	27241.00	10.0	244705903.00	24470590.30	269176493.30	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0827	M014		P0003	2025-04-11	2025-04-11 15:00:00	usage	3479.000	27424.00	0.0	95408096.00	0.00	95408096.00	Xuất tiếp sau nhập bù cho Nhà máy bao bì Tân Phú	[]	
T0828	M013		P0004	2025-04-02	2025-04-02 09:00:00	usage	5014.000	22999.00	0.0	115316986.00	0.00	115316986.00	Xuất tuần 1 cho Xưởng cơ khí Bình Dương	[]	
T0829	M020		P0004	2025-04-09	2025-04-09 10:00:00	usage	875.000	128299.00	0.0	112261625.00	0.00	112261625.00	Xuất tuần 2 cho Xưởng cơ khí Bình Dương	[]	
T0830	M014		P0005	2025-04-12	2025-04-12 13:00:00	usage	2996.000	27424.00	0.0	82162304.00	0.00	82162304.00	Xuất tuần 2 cho Trung tâm phân phối An Sương	[]	
T0831	M005		P0006	2025-04-10	2025-04-10 12:00:00	usage	6.154	23396646.00	0.0	143982959.48	0.00	143982959.48	Xuất tuần 2 cho Nhà máy thực phẩm GreenFarm	[]	
T0832	M010		P0007	2025-04-09	2025-04-09 13:00:00	usage	7.166	25377502.00	0.0	181855179.33	0.00	181855179.33	Xuất tuần 2 cho Kho thép Phú Mỹ	[]	
T0833	M005		P0008	2025-04-11	2025-04-11 09:00:00	usage	4.474	23396646.00	0.0	104676594.20	0.00	104676594.20	Xuất tuần 2 cho Nhà xưởng may Phước Đông	[]	
T0834	M020		P0009	2025-04-12	2025-04-12 11:00:00	usage	775.000	128299.00	0.0	99431725.00	0.00	99431725.00	Xuất tuần 2 cho Nhà máy nhựa Nam Việt	[]	
T0835	M008		P0007	2025-04-20	2025-04-20 17:00:00	usage	8.415	27211294.00	0.0	228983039.01	0.00	228983039.01	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T0836	M005		P0008	2025-04-21	2025-04-21 17:00:00	usage	5.894	23396646.00	0.0	137899831.52	0.00	137899831.52	Xuất tuần 3 cho Nhà xưởng may Phước Đông	[]	
T0837	M008		P0009	2025-04-16	2025-04-16 14:00:00	usage	8.368	27211294.00	0.0	227704108.19	0.00	227704108.19	Xuất tuần 3 cho Nhà máy nhựa Nam Việt	[]	
T0838	M009		P0010	2025-04-18	2025-04-18 13:00:00	usage	10.102	26099848.00	0.0	263660664.50	0.00	263660664.50	Xuất tuần 3 cho Khu bảo trì xe buýt Củ Chi	[]	
T0839	M018		P0011	2025-04-16	2025-04-16 12:00:00	usage	81.000	1628751.00	0.0	131928831.00	0.00	131928831.00	Xuất tuần 3 cho Nhà máy gỗ Đức Hòa	[]	
T0840	M005		P0010	2025-04-24	2025-04-24 13:00:00	usage	7.872	23396646.00	0.0	184178397.31	0.00	184178397.31	Xuất tuần 4 cho Khu bảo trì xe buýt Củ Chi	[]	
T0841	M001		P0011	2025-04-23	2025-04-23 10:00:00	usage	10.852	25685476.00	0.0	278738785.55	0.00	278738785.55	Xuất tuần 4 cho Nhà máy gỗ Đức Hòa	[]	
T0842	M016		P0012	2025-04-24	2025-04-24 11:00:00	usage	3451.000	53105.00	0.0	183265355.00	0.00	183265355.00	Xuất tuần 4 cho Kho tổng hợp Sóng Thần	[]	
T0843	M006	S0020		2025-05-02	2025-05-02 12:00:00	purchase	14.055	22514819.00	10.0	316445781.05	31644578.10	348090359.15	Nhập kế hoạch tuần đầu tháng 5/2025	[]	
T0844	M016	S0023		2025-05-07	2025-05-07 14:00:00	purchase	3433.000	50857.00	10.0	174592081.00	17459208.10	192051289.10	Nhập kế hoạch tuần đầu tháng 5/2025	[]	
T0845	M005	S0008		2025-05-07	2025-05-07 11:00:00	purchase	9.032	23387303.00	10.0	211234120.70	21123412.07	232357532.77	Nhập kế hoạch tuần đầu tháng 5/2025	[]	
T0846	M013	S0017		2025-05-01	2025-05-01 12:00:00	purchase	8635.000	23972.00	10.0	206998220.00	20699822.00	227698042.00	Nhập kế hoạch tuần đầu tháng 5/2025	[]	
T0847	M015		P0006	2025-05-05	2025-05-05 17:00:00	usage	1022.000	47390.00	0.0	48432580.00	0.00	48432580.00	Xuất tuần 1 cho Nhà máy thực phẩm GreenFarm	[]	
T0848	M008		P0007	2025-05-07	2025-05-07 17:00:00	usage	3.847	27211294.00	0.0	104681848.02	0.00	104681848.02	Xuất tuần 1 cho Kho thép Phú Mỹ	[]	
T0849	M016		P0008	2025-05-05	2025-05-05 11:00:00	usage	1306.000	52543.00	0.0	68621158.00	0.00	68621158.00	Xuất tuần 1 cho Nhà xưởng may Phước Đông	[]	
T0850	M002		P0009	2025-05-05	2025-05-05 11:00:00	usage	3.321	26967092.00	0.0	89557712.53	0.00	89557712.53	Xuất tuần 1 cho Nhà máy nhựa Nam Việt	[]	
T0851	M015		P0010	2025-05-06	2025-05-06 16:00:00	usage	2018.000	47390.00	0.0	95633020.00	0.00	95633020.00	Xuất tuần 1 cho Khu bảo trì xe buýt Củ Chi	[]	
T0852	M013		P0011	2025-05-07	2025-05-07 17:00:00	usage	2781.000	23242.00	0.0	64636002.00	0.00	64636002.00	Xuất tuần 1 cho Nhà máy gỗ Đức Hòa	[]	
T0853	M013		P0009	2025-05-10	2025-05-10 15:00:00	usage	5688.000	23242.00	0.0	132200496.00	0.00	132200496.00	Xuất tuần 2 cho Nhà máy nhựa Nam Việt	[]	
T0854	M008		P0010	2025-05-14	2025-05-14 11:00:00	usage	2.619	27211294.00	0.0	71266378.99	0.00	71266378.99	Xuất tuần 2 cho Khu bảo trì xe buýt Củ Chi	[]	
T0855	M005		P0011	2025-05-10	2025-05-10 09:00:00	usage	6.452	23394310.00	0.0	150940088.12	0.00	150940088.12	Xuất tuần 2 cho Nhà máy gỗ Đức Hòa	[]	
T0856	M005		P0012	2025-05-20	2025-05-20 16:00:00	usage	3.922	23394310.00	0.0	91752483.82	0.00	91752483.82	Xuất tuần 3 cho Kho tổng hợp Sóng Thần	[]	
T0857	M005	S0010		2025-05-28	2025-05-28 09:00:00	purchase	11.912	23625070.00	10.0	281421833.84	28142183.38	309564017.22	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 6mm	[]	
T0858	M005		P0012	2025-05-30	2025-05-30 15:00:00	usage	0.466	23463538.00	0.0	10934008.71	0.00	10934008.71	Xuất tiếp sau nhập bù cho Kho tổng hợp Sóng Thần	[]	
T0859	M007		P0013	2025-05-19	2025-05-19 13:00:00	usage	5.037	24666749.00	0.0	124246414.71	0.00	124246414.71	Xuất tuần 3 cho Nhà xưởng điện tử VSIP	[]	
T0860	M007	S0011		2025-05-21	2025-05-21 08:00:00	purchase	11.833	27077331.00	10.0	320406057.72	32040605.77	352446663.50	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T0861	M007		P0013	2025-05-22	2025-05-22 12:00:00	usage	0.757	25389924.00	0.0	19220172.47	0.00	19220172.47	Xuất tiếp sau nhập bù cho Nhà xưởng điện tử VSIP	[]	
T0862	M013		P0014	2025-05-20	2025-05-20 14:00:00	usage	2771.000	23242.00	0.0	64403582.00	0.00	64403582.00	Xuất tuần 3 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0863	M013	S0012		2025-05-25	2025-05-25 10:00:00	purchase	16439.000	24644.00	10.0	405122716.00	40512271.60	445634987.60	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M20x70	[]	
T0864	M013		P0014	2025-05-28	2025-05-28 09:00:00	usage	4998.000	23663.00	0.0	118267674.00	0.00	118267674.00	Xuất tiếp sau nhập bù cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0865	M002		P0015	2025-05-18	2025-05-18 17:00:00	usage	7.525	26967092.00	0.0	202927367.30	0.00	202927367.30	Xuất tuần 3 cho Kho hàng cảng Cát Lái	[]	
T0866	M002		P0015	2025-05-27	2025-05-27 13:00:00	usage	2.541	26967092.00	0.0	68523380.77	0.00	68523380.77	Xuất tuần 4 cho Kho hàng cảng Cát Lái	[]	
T0867	M018		P0016	2025-05-23	2025-05-23 17:00:00	usage	47.000	1628751.00	0.0	76551297.00	0.00	76551297.00	Xuất tuần 4 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0868	M018	S0016		2025-05-28	2025-05-28 10:00:00	purchase	33.000	1800361.00	10.0	59411913.00	5941191.30	65353104.30	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0869	M018		P0016	2025-05-30	2025-05-30 17:00:00	usage	12.000	1680234.00	0.0	20162808.00	0.00	20162808.00	Xuất tiếp sau nhập bù cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0870	M008		P0017	2025-05-26	2025-05-26 17:00:00	usage	2.051	27211294.00	0.0	55810363.99	0.00	55810363.99	Xuất tuần 4 cho Nhà máy dược phẩm Tân Uyên	[]	
T0871	M008		P0018	2025-05-28	2025-05-28 13:00:00	usage	2.479	27211294.00	0.0	67456797.83	0.00	67456797.83	Xuất tuần 4 cho Trạm logistics Nhơn Trạch	[]	
T0872	M012		P0006	2025-05-30	2025-05-30 15:00:00	return	18.000	74323.00	0.0	1337814.00	0.00	1337814.00	Trả vật tư dư cuối tháng từ Nhà máy thực phẩm GreenFarm	[]	
T0873	M011	S0021		2025-06-05	2025-06-05 11:00:00	purchase	21.122	28494531.00	10.0	601861483.78	60186148.38	662047632.16	Nhập theo chu kỳ dài Ống thép D114x4.0 tháng 6/2025	[]	
T0874	M017	S0024		2025-06-03	2025-06-03 09:00:00	purchase	11473.000	45498.00	10.0	521998554.00	52199855.40	574198409.40	Nhập kế hoạch tuần đầu tháng 6/2025	[]	
T0875	M020	S0027		2025-06-06	2025-06-06 15:00:00	purchase	3644.000	135476.00	10.0	493674544.00	49367454.40	543041998.40	Nhập kế hoạch tuần đầu tháng 6/2025	[]	
T0876	M015	S0012		2025-06-08	2025-06-08 09:00:00	purchase	8969.000	44626.00	10.0	400250594.00	40025059.40	440275653.40	Nhập kế hoạch tuần đầu tháng 6/2025	[]	
T0877	M015		P0011	2025-06-06	2025-06-06 09:00:00	usage	3933.000	46699.00	0.0	183667167.00	0.00	183667167.00	Xuất tuần 1 cho Nhà máy gỗ Đức Hòa	[]	
T0878	M004		P0012	2025-06-05	2025-06-05 13:00:00	usage	7.133	23794156.00	0.0	169723714.75	0.00	169723714.75	Xuất tuần 1 cho Kho tổng hợp Sóng Thần	[]	
T0879	M012		P0013	2025-06-06	2025-06-06 12:00:00	usage	2901.000	74323.00	0.0	215611023.00	0.00	215611023.00	Xuất tuần 1 cho Nhà xưởng điện tử VSIP	[]	
T0880	M007		P0014	2025-06-06	2025-06-06 16:00:00	usage	11.076	25389924.00	0.0	281218798.22	0.00	281218798.22	Xuất tuần 1 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0881	M007	S0014		2025-06-13	2025-06-13 09:00:00	purchase	43.636	24897264.00	10.0	1086417011.90	108641701.19	1195058713.09	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T0882	M007		P0014	2025-06-15	2025-06-15 10:00:00	usage	8.707	25242126.00	0.0	219783191.08	0.00	219783191.08	Xuất tiếp sau nhập bù cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0883	M016		P0014	2025-06-09	2025-06-09 09:00:00	usage	2490.000	52543.00	0.0	130832070.00	0.00	130832070.00	Xuất tuần 2 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T0884	M011		P0015	2025-06-14	2025-06-14 09:00:00	usage	9.292	27277556.00	0.0	253463050.35	0.00	253463050.35	Xuất tuần 2 cho Kho hàng cảng Cát Lái	[]	
T0885	M019		P0016	2025-06-14	2025-06-14 15:00:00	usage	28.000	1919964.00	0.0	53758992.00	0.00	53758992.00	Xuất tuần 2 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0886	M019	S0018		2025-06-20	2025-06-20 08:00:00	purchase	357.000	2009127.00	10.0	717258339.00	71725833.90	788984172.90	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0887	M019		P0016	2025-06-23	2025-06-23 13:00:00	usage	92.000	1946713.00	0.0	179097596.00	0.00	179097596.00	Xuất tiếp sau nhập bù cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0888	M017		P0017	2025-06-12	2025-06-12 14:00:00	usage	6434.000	43125.00	0.0	277466250.00	0.00	277466250.00	Xuất tuần 2 cho Nhà máy dược phẩm Tân Uyên	[]	
T0889	M011		P0018	2025-06-09	2025-06-09 17:00:00	usage	23.368	27277556.00	0.0	637421928.61	0.00	637421928.61	Xuất tuần 2 cho Trạm logistics Nhơn Trạch	[]	
T0890	M011	S0020		2025-06-13	2025-06-13 11:00:00	purchase	19.468	30387286.00	10.0	591579683.85	59157968.38	650737652.23	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0891	M011		P0018	2025-06-16	2025-06-16 09:00:00	usage	5.776	28210475.00	0.0	162943703.60	0.00	162943703.60	Xuất tiếp sau nhập bù cho Trạm logistics Nhơn Trạch	[]	
T0892	M007		P0017	2025-06-18	2025-06-18 11:00:00	usage	10.174	25242126.00	0.0	256813389.92	0.00	256813389.92	Xuất tuần 3 cho Nhà máy dược phẩm Tân Uyên	[]	
T0893	M011		P0018	2025-06-19	2025-06-19 09:00:00	usage	9.417	28210475.00	0.0	265658043.08	0.00	265658043.08	Xuất tuần 3 cho Trạm logistics Nhơn Trạch	[]	
T0894	M015		P0019	2025-06-19	2025-06-19 09:00:00	usage	31632.000	46699.00	0.0	1477182768.00	0.00	1477182768.00	Xuất tuần 3 cho Nhà xưởng cơ điện Quận 12	[]	
T0895	M015	S0023		2025-06-22	2025-06-22 11:00:00	purchase	1366.000	48344.00	10.0	66037904.00	6603790.40	72641694.40	Nhập bù sau khi gần cạn tồn Que hàn E7018 phi 4.0	[]	
T0896	M015		P0019	2025-06-23	2025-06-23 10:00:00	usage	614.000	47193.00	0.0	28976502.00	0.00	28976502.00	Xuất tiếp sau nhập bù cho Nhà xưởng cơ điện Quận 12	[]	
T0897	M012		P0020	2025-06-28	2025-06-28 10:00:00	usage	2684.000	74323.00	0.0	199482932.00	0.00	199482932.00	Xuất tuần 4 cho Kho nguyên liệu Bến Lức	[]	
T0898	M016		P0021	2025-06-28	2025-06-28 09:00:00	usage	4354.000	52543.00	0.0	228772222.00	0.00	228772222.00	Xuất tuần 4 cho Nhà máy giấy Mỹ Phước	[]	
T0899	M019		P0022	2025-06-26	2025-06-26 13:00:00	usage	120.000	1946713.00	0.0	233605560.00	0.00	233605560.00	Xuất tuần 4 cho Xưởng lắp ráp xe điện	[]	
T0900	M004		P0023	2025-06-23	2025-06-23 09:00:00	usage	3.071	23794156.00	0.0	73071853.08	0.00	73071853.08	Xuất tuần 4 cho Nhà máy nước giải khát Tây Ninh	[]	
T0901	M004	S0029		2025-06-26	2025-06-26 13:00:00	purchase	23.273	23445576.00	10.0	545648890.25	54564889.02	600213779.27	Nhập bù sau khi gần cạn tồn Thép U200x75x8.5	[]	
T0902	M004		P0023	2025-06-27	2025-06-27 15:00:00	usage	3.909	23689582.00	0.0	92602576.04	0.00	92602576.04	Xuất tiếp sau nhập bù cho Nhà máy nước giải khát Tây Ninh	[]	
T0903	M016		P0024	2025-06-23	2025-06-23 09:00:00	usage	12628.000	52543.00	0.0	663513004.00	0.00	663513004.00	Xuất tuần 4 cho Kho phân phối Bình Chánh	[]	
T0904	M016	S0030		2025-06-30	2025-06-30 13:00:00	purchase	1630.000	58041.00	10.0	94606830.00	9460683.00	104067513.00	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0905	M016		P0024	2025-06-30	2025-06-30 14:00:00	usage	500.000	54192.00	0.0	27096000.00	0.00	27096000.00	Xuất tiếp sau nhập bù cho Kho phân phối Bình Chánh	[]	
T0906	M007		P0011	2025-06-26	2025-06-26 15:00:00	return	4.951	25242126.00	0.0	124973765.83	0.00	124973765.83	Trả vật tư dư cuối tháng từ Nhà máy gỗ Đức Hòa	[]	
T0907	M013	S0016		2025-07-04	2025-07-04 10:00:00	purchase	18606.000	24092.00	10.0	448255752.00	44825575.20	493081327.20	Nhập kế hoạch tuần đầu tháng 7/2025	[]	
T0908	M010	S0019		2025-07-06	2025-07-06 12:00:00	purchase	15.686	26858399.00	10.0	421300846.71	42130084.67	463430931.39	Nhập kế hoạch tuần đầu tháng 7/2025	[]	
T0909	M009		P0016	2025-07-07	2025-07-07 12:00:00	usage	4.776	26099848.00	0.0	124652874.05	0.00	124652874.05	Xuất tuần 1 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T0910	M009		P0017	2025-07-02	2025-07-02 10:00:00	usage	4.124	26099848.00	0.0	107635773.15	0.00	107635773.15	Xuất tuần 1 cho Nhà máy dược phẩm Tân Uyên	[]	
T0911	M004		P0018	2025-07-04	2025-07-04 09:00:00	usage	7.021	23689582.00	0.0	166324555.22	0.00	166324555.22	Xuất tuần 1 cho Trạm logistics Nhơn Trạch	[]	
T0912	M011		P0019	2025-07-10	2025-07-10 17:00:00	usage	3.404	28210475.00	0.0	96028456.90	0.00	96028456.90	Xuất tuần 2 cho Nhà xưởng cơ điện Quận 12	[]	
T0913	M009		P0020	2025-07-11	2025-07-11 17:00:00	usage	3.706	26099848.00	0.0	96726036.69	0.00	96726036.69	Xuất tuần 2 cho Kho nguyên liệu Bến Lức	[]	
T0914	M005		P0021	2025-07-13	2025-07-13 14:00:00	usage	2.358	23463538.00	0.0	55327022.60	0.00	55327022.60	Xuất tuần 2 cho Nhà máy giấy Mỹ Phước	[]	
T0915	M017		P0022	2025-07-18	2025-07-18 11:00:00	usage	5639.000	43125.00	0.0	243181875.00	0.00	243181875.00	Xuất tuần 3 cho Xưởng lắp ráp xe điện	[]	
T0916	M008		P0023	2025-07-16	2025-07-16 09:00:00	usage	6.333	27211294.00	0.0	172329124.90	0.00	172329124.90	Xuất tuần 3 cho Nhà máy nước giải khát Tây Ninh	[]	
T0917	M011		P0024	2025-07-21	2025-07-21 09:00:00	usage	0.871	28210475.00	0.0	24571323.73	0.00	24571323.73	Xuất tuần 3 cho Kho phân phối Bình Chánh	[]	
T0918	M011	S0004		2025-07-28	2025-07-28 13:00:00	purchase	11.930	27285556.00	10.0	325516683.08	32551668.31	358068351.39	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T0919	M011		P0024	2025-07-29	2025-07-29 17:00:00	usage	3.541	27932999.00	0.0	98910749.46	0.00	98910749.46	Xuất tiếp sau nhập bù cho Kho phân phối Bình Chánh	[]	
T0920	M004		P0025	2025-07-27	2025-07-27 14:00:00	usage	4.988	23689582.00	0.0	118163635.02	0.00	118163635.02	Xuất tuần 4 cho Nhà máy sơn Long Thành	[]	
T0921	M003		P0026	2025-07-24	2025-07-24 10:00:00	usage	9.590	23722097.00	0.0	227494910.23	0.00	227494910.23	Xuất tuần 4 cho Xưởng bao bì carton Cần Giuộc	[]	
T0922	M007		P0027	2025-07-27	2025-07-27 09:00:00	usage	5.284	25242126.00	0.0	133379393.78	0.00	133379393.78	Xuất tuần 4 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0923	M006		P0028	2025-07-25	2025-07-25 11:00:00	usage	8.279	23389724.00	0.0	193643525.00	0.00	193643525.00	Xuất tuần 4 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0924	M017		P0016	2025-07-28	2025-07-28 15:00:00	return	41.000	43125.00	0.0	1768125.00	0.00	1768125.00	Trả vật tư dư cuối tháng từ Xưởng sản xuất nội thất Hóc Môn	[]	
T0925	M001	S0011		2025-08-07	2025-08-07 09:00:00	purchase	7.041	25839477.00	10.0	181935757.56	18193575.76	200129333.31	Nhập kế hoạch tuần đầu tháng 8/2025	[]	
T0926	M018	S0014		2025-08-03	2025-08-03 15:00:00	purchase	188.000	1625011.00	10.0	305502068.00	30550206.80	336052274.80	Nhập kế hoạch tuần đầu tháng 8/2025	[]	
T0927	M002	S0017		2025-08-06	2025-08-06 12:00:00	purchase	16.886	25446438.00	8.0	429688552.07	34375084.17	464063636.23	Nhập theo chu kỳ dài Thép hình H300x300x10x15 tháng 8/2025	[]	
T0928	M009	S0008		2025-08-01	2025-08-01 14:00:00	purchase	17.270	27889874.00	10.0	481658123.98	48165812.40	529823936.38	Nhập kế hoạch tuần đầu tháng 8/2025	[]	
T0929	M010	S0011		2025-08-01	2025-08-01 09:00:00	purchase	16.819	25974336.00	10.0	436862357.18	43686235.72	480548592.90	Nhập kế hoạch tuần đầu tháng 8/2025	[]	
T0930	M010		P0021	2025-08-04	2025-08-04 09:00:00	usage	2.616	25804379.00	0.0	67504255.46	0.00	67504255.46	Xuất tuần 1 cho Nhà máy giấy Mỹ Phước	[]	
T0931	M002		P0022	2025-08-02	2025-08-02 16:00:00	usage	4.193	26586929.00	0.0	111478993.30	0.00	111478993.30	Xuất tuần 1 cho Xưởng lắp ráp xe điện	[]	
T0932	M007		P0023	2025-08-05	2025-08-05 15:00:00	usage	3.289	25242126.00	0.0	83021352.41	0.00	83021352.41	Xuất tuần 1 cho Nhà máy nước giải khát Tây Ninh	[]	
T0933	M019		P0024	2025-08-10	2025-08-10 11:00:00	usage	38.000	1946713.00	0.0	73975094.00	0.00	73975094.00	Xuất tuần 2 cho Kho phân phối Bình Chánh	[]	
T0934	M010		P0025	2025-08-13	2025-08-13 15:00:00	usage	6.056	25804379.00	0.0	156271319.22	0.00	156271319.22	Xuất tuần 2 cho Nhà máy sơn Long Thành	[]	
T0935	M020		P0026	2025-08-10	2025-08-10 14:00:00	usage	541.000	130093.00	0.0	70380313.00	0.00	70380313.00	Xuất tuần 2 cho Xưởng bao bì carton Cần Giuộc	[]	
T0936	M018		P0027	2025-08-09	2025-08-09 17:00:00	usage	63.000	1666428.00	0.0	104984964.00	0.00	104984964.00	Xuất tuần 2 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0937	M007		P0028	2025-08-13	2025-08-13 12:00:00	usage	5.986	25242126.00	0.0	151099366.24	0.00	151099366.24	Xuất tuần 2 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0938	M002		P0027	2025-08-18	2025-08-18 11:00:00	usage	3.352	26586929.00	0.0	89119386.01	0.00	89119386.01	Xuất tuần 3 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0939	M018		P0028	2025-08-16	2025-08-16 14:00:00	usage	78.000	1666428.00	0.0	129981384.00	0.00	129981384.00	Xuất tuần 3 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0940	M014		P0029	2025-08-21	2025-08-21 11:00:00	usage	2508.000	27424.00	0.0	68779392.00	0.00	68779392.00	Xuất tuần 3 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0941	M014	S0015		2025-08-28	2025-08-28 12:00:00	purchase	8845.000	29540.00	10.0	261281300.00	26128130.00	287409430.00	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T0942	M014		P0029	2025-08-31	2025-08-31 12:00:00	usage	3060.000	28059.00	0.0	85860540.00	0.00	85860540.00	Xuất tiếp sau nhập bù cho Nhà xưởng phụ trợ Dĩ An	[]	
T0943	M003		P0030	2025-08-21	2025-08-21 12:00:00	usage	7.015	23722097.00	0.0	166410510.45	0.00	166410510.45	Xuất tuần 3 cho Trung tâm vận hành Đức Trọng	[]	
T0944	M003	S0016		2025-08-25	2025-08-25 14:00:00	purchase	8.126	22843771.00	10.0	185628483.15	18562848.31	204191331.46	Nhập bù sau khi gần cạn tồn Thép I250x125x6x9	[]	
T0945	M003		P0030	2025-08-26	2025-08-26 11:00:00	usage	0.967	23458599.00	0.0	22684465.23	0.00	22684465.23	Xuất tiếp sau nhập bù cho Trung tâm vận hành Đức Trọng	[]	
T0946	M010		P0030	2025-08-27	2025-08-27 09:00:00	usage	5.695	25804379.00	0.0	146955938.41	0.00	146955938.41	Xuất tuần 4 cho Trung tâm vận hành Đức Trọng	[]	
T0947	M003		P0031	2025-08-27	2025-08-27 12:00:00	usage	4.271	23458599.00	0.0	100191676.33	0.00	100191676.33	Xuất tuần 4 cho Nhà máy phân bón Long An	[]	
T0948	M001		P0032	2025-08-25	2025-08-25 09:00:00	usage	4.364	25723976.00	0.0	112259431.26	0.00	112259431.26	Xuất tuần 4 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0949	M018		P0033	2025-08-27	2025-08-27 09:00:00	usage	54.000	1666428.00	0.0	89987112.00	0.00	89987112.00	Xuất tuần 4 cho Nhà xưởng sản xuất pallet	[]	
T0950	M006	S0027		2025-09-07	2025-09-07 10:00:00	purchase	11.006	22328161.00	8.0	245743739.97	19659499.20	265403239.16	Nhập kế hoạch tuần đầu tháng 9/2025	[]	
T0951	M010	S0021		2025-09-03	2025-09-03 12:00:00	purchase	17.810	26790713.00	8.0	477142598.53	38171407.88	515314006.41	Nhập kế hoạch tuần đầu tháng 9/2025	[]	
T0952	M010		P0026	2025-09-03	2025-09-03 09:00:00	usage	6.903	26050963.00	0.0	179829797.59	0.00	179829797.59	Xuất tuần 1 cho Xưởng bao bì carton Cần Giuộc	[]	
T0953	M001		P0027	2025-09-06	2025-09-06 16:00:00	usage	3.821	25723976.00	0.0	98291312.30	0.00	98291312.30	Xuất tuần 1 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T0954	M002		P0028	2025-09-07	2025-09-07 17:00:00	usage	5.797	26586929.00	0.0	154124427.41	0.00	154124427.41	Xuất tuần 1 cho Kho lạnh thủy sản Vũng Tàu	[]	
T0955	M019		P0029	2025-09-03	2025-09-03 16:00:00	usage	54.000	1946713.00	0.0	105122502.00	0.00	105122502.00	Xuất tuần 1 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0956	M007		P0029	2025-09-10	2025-09-10 15:00:00	usage	3.806	25242126.00	0.0	96071531.56	0.00	96071531.56	Xuất tuần 2 cho Nhà xưởng phụ trợ Dĩ An	[]	
T0957	M010		P0030	2025-09-12	2025-09-12 12:00:00	usage	3.964	26050963.00	0.0	103266017.33	0.00	103266017.33	Xuất tuần 2 cho Trung tâm vận hành Đức Trọng	[]	
T0958	M006		P0031	2025-09-13	2025-09-13 12:00:00	usage	4.411	23124333.00	0.0	102001432.86	0.00	102001432.86	Xuất tuần 2 cho Nhà máy phân bón Long An	[]	
T0959	M002		P0032	2025-09-18	2025-09-18 11:00:00	usage	4.337	26586929.00	0.0	115307511.07	0.00	115307511.07	Xuất tuần 3 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0960	M002	S0024		2025-09-27	2025-09-27 09:00:00	purchase	22.557	27386484.00	10.0	617756919.59	61775691.96	679532611.55	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T0961	M002		P0032	2025-09-29	2025-09-29 09:00:00	usage	4.250	26826795.00	0.0	114013878.75	0.00	114013878.75	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0962	M005		P0033	2025-09-17	2025-09-17 16:00:00	usage	7.760	23463538.00	0.0	182077054.88	0.00	182077054.88	Xuất tuần 3 cho Nhà xưởng sản xuất pallet	[]	
T0963	M010		P0034	2025-09-20	2025-09-20 11:00:00	usage	9.680	26050963.00	0.0	252173321.84	0.00	252173321.84	Xuất tuần 3 cho Nhà máy nông sản Cái Bè	[]	
T0964	M002		P0035	2025-09-26	2025-09-26 10:00:00	usage	2.920	26826795.00	0.0	78334241.40	0.00	78334241.40	Xuất tuần 4 cho Xưởng gia công thép Thủ Đức	[]	
T0965	M008		P0036	2025-09-28	2025-09-28 09:00:00	usage	5.040	27211294.00	0.0	137144921.76	0.00	137144921.76	Xuất tuần 4 cho Kho ngoại quan Hiệp Phước	[]	
T0966	M009		P0037	2025-09-27	2025-09-27 11:00:00	usage	3.928	26547355.00	0.0	104278010.44	0.00	104278010.44	Xuất tuần 4 cho Nhà máy điện mặt trời phụ trợ	[]	
T0967	M012		P0038	2025-09-23	2025-09-23 12:00:00	usage	2622.000	74323.00	0.0	194874906.00	0.00	194874906.00	Xuất tuần 4 cho Trung tâm bảo trì thiết bị	[]	
T0968	M006		P0039	2025-09-24	2025-09-24 17:00:00	usage	4.237	23124333.00	0.0	97977798.92	0.00	97977798.92	Xuất tuần 4 cho Nhà máy chế biến gạo Sa Đéc	[]	
T0969	M009		P0026	2025-09-26	2025-09-26 15:00:00	return	1.954	26547355.00	0.0	51873531.67	0.00	51873531.67	Trả vật tư dư cuối tháng từ Xưởng bao bì carton Cần Giuộc	[]	
T0970	M003	S0019		2025-10-08	2025-10-08 11:00:00	purchase	13.852	23987588.00	10.0	332276068.98	33227606.90	365503675.87	Nhập kế hoạch tuần đầu tháng 10/2025	[]	
T0971	M017	S0007		2025-10-04	2025-10-04 09:00:00	purchase	16347.000	46036.00	10.0	752550492.00	75255049.20	827805541.20	Nhập kế hoạch tuần đầu tháng 10/2025	[]	
T0972	M010	S0013		2025-10-06	2025-10-06 12:00:00	purchase	20.695	25364179.00	10.0	524911684.41	52491168.44	577402852.85	Nhập kế hoạch tuần đầu tháng 10/2025	[]	
T0973	M006	S0016		2025-10-03	2025-10-03 11:00:00	purchase	16.681	24460085.00	10.0	408018677.89	40801867.79	448820545.67	Nhập kế hoạch tuần đầu tháng 10/2025	[]	
T0974	M008	S0019		2025-10-08	2025-10-08 11:00:00	purchase	23.907	26868246.00	10.0	642339157.12	64233915.71	706573072.83	Nhập kế hoạch tuần đầu tháng 10/2025	[]	
T0975	M001		P0031	2025-10-02	2025-10-02 12:00:00	usage	4.808	25723976.00	0.0	123680876.61	0.00	123680876.61	Xuất tuần 1 cho Nhà máy phân bón Long An	[]	
T0976	M019		P0032	2025-10-02	2025-10-02 13:00:00	usage	53.000	1946713.00	0.0	103175789.00	0.00	103175789.00	Xuất tuần 1 cho Kho vật tư công nghiệp Tân Tạo	[]	
T0977	M019	S0026		2025-10-08	2025-10-08 10:00:00	purchase	31.000	2097001.00	10.0	65007031.00	6500703.10	71507734.10	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0978	M019		P0032	2025-10-11	2025-10-11 13:00:00	usage	9.000	1991799.00	0.0	17926191.00	0.00	17926191.00	Xuất tiếp sau nhập bù cho Kho vật tư công nghiệp Tân Tạo	[]	
T0979	M018		P0033	2025-10-04	2025-10-04 11:00:00	usage	14.000	1666428.00	0.0	23329992.00	0.00	23329992.00	Xuất tuần 1 cho Nhà xưởng sản xuất pallet	[]	
T0980	M018	S0027		2025-10-11	2025-10-11 12:00:00	purchase	79.000	1655141.00	10.0	130756139.00	13075613.90	143831752.90	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0981	M018		P0033	2025-10-12	2025-10-12 11:00:00	usage	25.000	1663042.00	0.0	41576050.00	0.00	41576050.00	Xuất tiếp sau nhập bù cho Nhà xưởng sản xuất pallet	[]	
T0982	M018		P0034	2025-10-03	2025-10-03 10:00:00	usage	54.000	1663042.00	0.0	89804268.00	0.00	89804268.00	Xuất tuần 1 cho Nhà máy nông sản Cái Bè	[]	
T0983	M018	S0028		2025-10-12	2025-10-12 13:00:00	purchase	104.000	1830362.00	10.0	190357648.00	19035764.80	209393412.80	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T0984	M018		P0034	2025-10-14	2025-10-14 09:00:00	usage	49.000	1713238.00	0.0	83948662.00	0.00	83948662.00	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T0985	M016		P0035	2025-10-05	2025-10-05 13:00:00	usage	1130.000	54192.00	0.0	61236960.00	0.00	61236960.00	Xuất tuần 1 cho Xưởng gia công thép Thủ Đức	[]	
T0986	M016	S0029		2025-10-12	2025-10-12 12:00:00	purchase	2030.000	52546.00	10.0	106668380.00	10666838.00	117335218.00	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0987	M016		P0035	2025-10-15	2025-10-15 15:00:00	usage	868.000	53698.00	0.0	46609864.00	0.00	46609864.00	Xuất tiếp sau nhập bù cho Xưởng gia công thép Thủ Đức	[]	
T0988	M016		P0036	2025-10-06	2025-10-06 13:00:00	usage	1162.000	53698.00	0.0	62397076.00	0.00	62397076.00	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T0989	M016	S0030		2025-10-10	2025-10-10 10:00:00	purchase	2203.000	58459.00	10.0	128785177.00	12878517.70	141663694.70	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T0990	M016		P0036	2025-10-11	2025-10-11 09:00:00	usage	1037.000	55126.00	0.0	57165662.00	0.00	57165662.00	Xuất tiếp sau nhập bù cho Kho ngoại quan Hiệp Phước	[]	
T0991	M019		P0034	2025-10-14	2025-10-14 17:00:00	usage	22.000	1991799.00	0.0	43819578.00	0.00	43819578.00	Xuất tuần 2 cho Nhà máy nông sản Cái Bè	[]	
T0992	M019	S0030		2025-10-22	2025-10-22 12:00:00	purchase	121.000	1922199.00	10.0	232586079.00	23258607.90	255844686.90	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0993	M019		P0034	2025-10-23	2025-10-23 12:00:00	usage	53.000	1970919.00	0.0	104458707.00	0.00	104458707.00	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T0994	M019		P0035	2025-10-09	2025-10-09 17:00:00	usage	68.000	1970919.00	0.0	134022492.00	0.00	134022492.00	Xuất tuần 2 cho Xưởng gia công thép Thủ Đức	[]	
T0995	M019	S0001		2025-10-13	2025-10-13 13:00:00	purchase	46.000	2043205.00	10.0	93987430.00	9398743.00	103386173.00	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T0996	M019		P0035	2025-10-16	2025-10-16 13:00:00	usage	10.000	1992605.00	0.0	19926050.00	0.00	19926050.00	Xuất tiếp sau nhập bù cho Xưởng gia công thép Thủ Đức	[]	
T0997	M003		P0036	2025-10-10	2025-10-10 09:00:00	usage	8.202	23590846.00	0.0	193492118.89	0.00	193492118.89	Xuất tuần 2 cho Kho ngoại quan Hiệp Phước	[]	
T0998	M002		P0037	2025-10-12	2025-10-12 15:00:00	usage	5.502	26826795.00	0.0	147601026.09	0.00	147601026.09	Xuất tuần 2 cho Nhà máy điện mặt trời phụ trợ	[]	
T0999	M019		P0038	2025-10-12	2025-10-12 09:00:00	usage	36.000	1992605.00	0.0	71733780.00	0.00	71733780.00	Xuất tuần 2 cho Trung tâm bảo trì thiết bị	[]	
T1000	M019	S0004		2025-10-14	2025-10-14 13:00:00	purchase	63.000	2083001.00	10.0	131229063.00	13122906.30	144351969.30	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T1001	M019		P0038	2025-10-17	2025-10-17 09:00:00	usage	21.000	2019724.00	0.0	42414204.00	0.00	42414204.00	Xuất tiếp sau nhập bù cho Trung tâm bảo trì thiết bị	[]	
T1002	M001		P0039	2025-10-10	2025-10-10 10:00:00	usage	8.177	25723976.00	0.0	210344951.75	0.00	210344951.75	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T1003	M009		P0037	2025-10-21	2025-10-21 09:00:00	usage	14.126	26547355.00	0.0	375007936.73	0.00	375007936.73	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T1004	M001		P0038	2025-10-21	2025-10-21 17:00:00	usage	0.186	25723976.00	0.0	4784659.54	0.00	4784659.54	Xuất tuần 3 cho Trung tâm bảo trì thiết bị	[]	
T1005	M001	S0006		2025-10-26	2025-10-26 08:00:00	purchase	21.038	25941458.00	10.0	545756393.40	54575639.34	600332032.74	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T1006	M001		P0038	2025-10-27	2025-10-27 15:00:00	usage	4.519	25789221.00	0.0	116541489.70	0.00	116541489.70	Xuất tiếp sau nhập bù cho Trung tâm bảo trì thiết bị	[]	
T1007	M009		P0039	2025-10-16	2025-10-16 11:00:00	usage	13.761	26547355.00	0.0	365318152.16	0.00	365318152.16	Xuất tuần 3 cho Nhà máy chế biến gạo Sa Đéc	[]	
T1008	M002		P0040	2025-10-17	2025-10-17 11:00:00	usage	9.712	26826795.00	0.0	260541833.04	0.00	260541833.04	Xuất tuần 3 cho Xưởng sản xuất container module	[]	
T1009	M010		P0040	2025-10-27	2025-10-27 10:00:00	usage	9.693	25879267.00	0.0	250847735.03	0.00	250847735.03	Xuất tuần 4 cho Xưởng sản xuất container module	[]	
T1010	M009		P0001	2025-10-24	2025-10-24 10:00:00	usage	1.200	26547355.00	0.0	31856826.00	0.00	31856826.00	Xuất tuần 4 cho Nhà xưởng Sunrise Long An	[]	
T1011	M009	S0011		2025-10-28	2025-10-28 08:00:00	purchase	20.826	29682313.00	10.0	618163850.54	61816385.05	679980235.59	Nhập bù sau khi gần cạn tồn Thép hộp 150x150x5	[]	
T1012	M009		P0001	2025-10-31	2025-10-31 13:00:00	usage	6.430	27487842.00	0.0	176746824.06	0.00	176746824.06	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T1013	M001		P0002	2025-10-26	2025-10-26 17:00:00	usage	7.215	25789221.00	0.0	186069229.52	0.00	186069229.52	Xuất tuần 4 cho Kho lạnh Mekong Logistics	[]	
T1014	M018		P0003	2025-10-25	2025-10-25 12:00:00	usage	55.000	1713238.00	0.0	94228090.00	0.00	94228090.00	Xuất tuần 4 cho Nhà máy bao bì Tân Phú	[]	
T1015	M018	S0013		2025-10-31	2025-10-31 10:00:00	purchase	170.000	1721937.00	10.0	292729290.00	29272929.00	322002219.00	Nhập bù sau khi gần cạn tồn Sơn chống gỉ epoxy xám	[]	
T1016	M018		P0003	2025-10-31	2025-10-31 15:00:00	usage	44.000	1715848.00	0.0	75497312.00	0.00	75497312.00	Xuất tiếp sau nhập bù cho Nhà máy bao bì Tân Phú	[]	
T1017	M010		P0004	2025-10-24	2025-10-24 09:00:00	usage	9.337	25879267.00	0.0	241634715.98	0.00	241634715.98	Xuất tuần 4 cho Xưởng cơ khí Bình Dương	[]	
T1018	M002	S0011		2025-11-06	2025-11-06 11:00:00	purchase	7.298	27693081.00	10.0	202104105.14	20210410.51	222314515.65	Nhập theo chu kỳ dài Thép hình H300x300x10x15 tháng 11/2025	[]	
T1019	M010	S0017		2025-11-02	2025-11-02 12:00:00	purchase	8.632	26816423.00	10.0	231479363.34	23147936.33	254627299.67	Nhập kế hoạch tuần đầu tháng 11/2025	[]	
T1020	M006	S0020		2025-11-08	2025-11-08 11:00:00	purchase	7.400	24185292.00	10.0	178971160.80	17897116.08	196868276.88	Nhập kế hoạch tuần đầu tháng 11/2025	[]	
T1021	M018	S0023		2025-11-02	2025-11-02 12:00:00	purchase	182.000	1828529.00	10.0	332792278.00	33279227.80	366071505.80	Nhập kế hoạch tuần đầu tháng 11/2025	[]	
T1022	M003	S0026		2025-11-02	2025-11-02 14:00:00	purchase	15.585	22816809.00	10.0	355599968.27	35559996.83	391159965.09	Nhập kế hoạch tuần đầu tháng 11/2025	[]	
T1023	M001		P0036	2025-11-02	2025-11-02 10:00:00	usage	3.541	25789221.00	0.0	91319631.56	0.00	91319631.56	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T1024	M018		P0037	2025-11-06	2025-11-06 09:00:00	usage	93.000	1744018.00	0.0	162193674.00	0.00	162193674.00	Xuất tuần 1 cho Nhà máy điện mặt trời phụ trợ	[]	
T1025	M003		P0038	2025-11-07	2025-11-07 10:00:00	usage	4.395	23397337.00	0.0	102831296.12	0.00	102831296.12	Xuất tuần 1 cho Trung tâm bảo trì thiết bị	[]	
T1026	M020		P0039	2025-11-03	2025-11-03 12:00:00	usage	849.000	130093.00	0.0	110448957.00	0.00	110448957.00	Xuất tuần 1 cho Nhà máy chế biến gạo Sa Đéc	[]	
T1027	M010		P0039	2025-11-09	2025-11-09 13:00:00	usage	2.804	26113556.00	0.0	73222411.02	0.00	73222411.02	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T1028	M001		P0040	2025-11-09	2025-11-09 09:00:00	usage	1.452	25789221.00	0.0	37445948.89	0.00	37445948.89	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T1029	M010		P0001	2025-11-10	2025-11-10 12:00:00	usage	2.218	26113556.00	0.0	57919867.21	0.00	57919867.21	Xuất tuần 2 cho Nhà xưởng Sunrise Long An	[]	
T1030	M020		P0002	2025-11-13	2025-11-13 10:00:00	usage	372.000	130093.00	0.0	48394596.00	0.00	48394596.00	Xuất tuần 2 cho Kho lạnh Mekong Logistics	[]	
T1031	M010		P0003	2025-11-12	2025-11-12 11:00:00	usage	2.352	26113556.00	0.0	61419083.71	0.00	61419083.71	Xuất tuần 2 cho Nhà máy bao bì Tân Phú	[]	
T1032	M001		P0002	2025-11-17	2025-11-17 16:00:00	usage	4.311	25789221.00	0.0	111177331.73	0.00	111177331.73	Xuất tuần 3 cho Kho lạnh Mekong Logistics	[]	
T1033	M001	S0016		2025-11-21	2025-11-21 10:00:00	purchase	22.261	26213314.00	10.0	583534582.95	58353458.30	641888041.25	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T1034	M001		P0002	2025-11-23	2025-11-23 10:00:00	usage	3.204	25916449.00	0.0	83036302.60	0.00	83036302.60	Xuất tiếp sau nhập bù cho Kho lạnh Mekong Logistics	[]	
T1035	M010		P0003	2025-11-20	2025-11-20 12:00:00	usage	6.684	26113556.00	0.0	174543008.30	0.00	174543008.30	Xuất tuần 3 cho Nhà máy bao bì Tân Phú	[]	
T1036	M012		P0004	2025-11-17	2025-11-17 13:00:00	usage	2703.000	74323.00	0.0	200895069.00	0.00	200895069.00	Xuất tuần 3 cho Xưởng cơ khí Bình Dương	[]	
T1037	M010		P0005	2025-11-21	2025-11-21 13:00:00	usage	7.717	26113556.00	0.0	201518311.65	0.00	201518311.65	Xuất tuần 3 cho Trung tâm phân phối An Sương	[]	
T1038	M006		P0006	2025-11-17	2025-11-17 12:00:00	usage	4.061	23640026.00	0.0	96002145.59	0.00	96002145.59	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T1039	M003		P0005	2025-11-26	2025-11-26 14:00:00	usage	5.221	23397337.00	0.0	122157496.48	0.00	122157496.48	Xuất tuần 4 cho Trung tâm phân phối An Sương	[]	
T1040	M014		P0006	2025-11-27	2025-11-27 13:00:00	usage	4721.000	28059.00	0.0	132466539.00	0.00	132466539.00	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T1041	M003		P0007	2025-11-26	2025-11-26 16:00:00	usage	3.335	23397337.00	0.0	78030118.90	0.00	78030118.90	Xuất tuần 4 cho Kho thép Phú Mỹ	[]	
T1042	M016		P0008	2025-11-26	2025-11-26 14:00:00	usage	1166.000	55126.00	0.0	64276916.00	0.00	64276916.00	Xuất tuần 4 cho Nhà xưởng may Phước Đông	[]	
tvskh2605180701324218	M006	\N	\N	2026-05-18	2026-05-18 14:00:00	transfer_sw	11.000	\N	\N	\N	\N	0.00	Chuyển sang kho cấu kiện	\N	\N
T1043	M016	S0024		2025-11-30	2025-11-30 13:00:00	purchase	3784.000	61642.00	10.0	233253328.00	23325332.80	256578660.80	Nhập bù sau khi gần cạn tồn Dây hàn lõi thuốc E71T-1	[]	
T1044	M016		P0008	2025-11-30	2025-11-30 13:00:00	usage	1298.000	57081.00	0.0	74091138.00	0.00	74091138.00	Xuất tiếp sau nhập bù cho Nhà xưởng may Phước Đông	[]	
T1045	M002		P0009	2025-11-25	2025-11-25 17:00:00	usage	6.967	27043367.00	0.0	188411137.89	0.00	188411137.89	Xuất tuần 4 cho Nhà máy nhựa Nam Việt	[]	
T1046	M006		P0010	2025-11-25	2025-11-25 14:00:00	usage	4.897	23640026.00	0.0	115765207.32	0.00	115765207.32	Xuất tuần 4 cho Khu bảo trì xe buýt Củ Chi	[]	
T1047	M016	S0003		2025-12-01	2025-12-01 10:00:00	purchase	4769.000	61091.00	10.0	291342979.00	29134297.90	320477276.90	Nhập kế hoạch tuần đầu tháng 12/2025	[]	
T1048	M008	S0015		2025-12-08	2025-12-08 14:00:00	purchase	13.429	26141254.00	10.0	351050899.97	35105090.00	386155989.96	Nhập kế hoạch tuần đầu tháng 12/2025	[]	
T1049	M006	S0021		2025-12-05	2025-12-05 12:00:00	purchase	7.978	25212496.00	10.0	201145293.09	20114529.31	221259822.40	Nhập kế hoạch tuần đầu tháng 12/2025	[]	
T1050	M020	S0027		2025-12-03	2025-12-03 12:00:00	purchase	3257.000	130581.00	10.0	425302317.00	42530231.70	467832548.70	Nhập kế hoạch tuần đầu tháng 12/2025	[]	
T1051	M016		P0001	2025-12-04	2025-12-04 12:00:00	usage	2145.000	58084.00	0.0	124590180.00	0.00	124590180.00	Xuất tuần 1 cho Nhà xưởng Sunrise Long An	[]	
T1052	M004		P0002	2025-12-04	2025-12-04 16:00:00	usage	7.355	23689582.00	0.0	174236875.61	0.00	174236875.61	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T1053	M004	S0018		2025-12-10	2025-12-10 11:00:00	purchase	5.848	25560084.00	10.0	149475371.23	14947537.12	164422908.36	Nhập bù sau khi gần cạn tồn Thép U200x75x8.5	[]	
T1054	M004		P0002	2025-12-12	2025-12-12 14:00:00	usage	0.602	24250733.00	0.0	14598941.27	0.00	14598941.27	Xuất tiếp sau nhập bù cho Kho lạnh Mekong Logistics	[]	
T1055	M018		P0003	2025-12-04	2025-12-04 11:00:00	usage	71.000	1744018.00	0.0	123825278.00	0.00	123825278.00	Xuất tuần 1 cho Nhà máy bao bì Tân Phú	[]	
T1056	M004		P0004	2025-12-02	2025-12-02 14:00:00	usage	5.246	24250733.00	0.0	127219345.32	0.00	127219345.32	Xuất tuần 1 cho Xưởng cơ khí Bình Dương	[]	
T1057	M004	S0020		2025-12-05	2025-12-05 13:00:00	purchase	13.562	24428187.00	10.0	331295072.09	33129507.21	364424579.30	Nhập bù sau khi gần cạn tồn Thép U200x75x8.5	[]	
T1058	M004		P0004	2025-12-06	2025-12-06 17:00:00	usage	0.288	24303969.00	0.0	6999543.07	0.00	6999543.07	Xuất tiếp sau nhập bù cho Xưởng cơ khí Bình Dương	[]	
T1059	M009		P0004	2025-12-14	2025-12-14 15:00:00	usage	5.102	27487842.00	0.0	140242969.88	0.00	140242969.88	Xuất tuần 2 cho Xưởng cơ khí Bình Dương	[]	
T1060	M017		P0005	2025-12-12	2025-12-12 11:00:00	usage	1384.000	43853.00	0.0	60692552.00	0.00	60692552.00	Xuất tuần 2 cho Trung tâm phân phối An Sương	[]	
T1061	M009		P0006	2025-12-09	2025-12-09 17:00:00	usage	3.048	27487842.00	0.0	83782942.42	0.00	83782942.42	Xuất tuần 2 cho Nhà máy thực phẩm GreenFarm	[]	
T1062	M008		P0007	2025-12-19	2025-12-19 16:00:00	usage	5.503	26879463.00	0.0	147917684.89	0.00	147917684.89	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T1063	M018		P0008	2025-12-18	2025-12-18 13:00:00	usage	48.000	1744018.00	0.0	83712864.00	0.00	83712864.00	Xuất tuần 3 cho Nhà xưởng may Phước Đông	[]	
T1064	M003		P0009	2025-12-19	2025-12-19 12:00:00	usage	5.978	23397337.00	0.0	139869280.59	0.00	139869280.59	Xuất tuần 3 cho Nhà máy nhựa Nam Việt	[]	
T1065	M014		P0010	2025-12-28	2025-12-28 09:00:00	usage	1064.000	28059.00	0.0	29854776.00	0.00	29854776.00	Xuất tuần 4 cho Khu bảo trì xe buýt Củ Chi	[]	
T1066	M014	S0002		2025-12-31	2025-12-31 12:00:00	purchase	5523.000	27265.00	10.0	150584595.00	15058459.50	165643054.50	Nhập bù sau khi gần cạn tồn Bu lông cường độ cao M22x80	[]	
T1067	M014		P0010	2025-12-31	2025-12-31 11:00:00	usage	2674.000	27821.00	0.0	74393354.00	0.00	74393354.00	Xuất tiếp sau nhập bù cho Khu bảo trì xe buýt Củ Chi	[]	
T1068	M003		P0011	2025-12-26	2025-12-26 17:00:00	usage	5.194	23397337.00	0.0	121525768.38	0.00	121525768.38	Xuất tuần 4 cho Nhà máy gỗ Đức Hòa	[]	
T1069	M003	S0003		2025-12-31	2025-12-31 09:00:00	purchase	18.564	24513940.00	10.0	455076782.16	45507678.22	500584460.38	Nhập bù sau khi gần cạn tồn Thép I250x125x6x9	[]	
T1070	M003		P0011	2025-12-31	2025-12-31 10:00:00	usage	2.266	23732318.00	0.0	53777432.59	0.00	53777432.59	Xuất tiếp sau nhập bù cho Nhà máy gỗ Đức Hòa	[]	
T1071	M008		P0012	2025-12-27	2025-12-27 09:00:00	usage	5.848	26879463.00	0.0	157191099.62	0.00	157191099.62	Xuất tuần 4 cho Kho tổng hợp Sóng Thần	[]	
T1072	M003		P0013	2025-12-23	2025-12-23 13:00:00	usage	5.970	23732318.00	0.0	141681938.46	0.00	141681938.46	Xuất tuần 4 cho Nhà xưởng điện tử VSIP	[]	
T1073	M020		P0014	2025-12-28	2025-12-28 13:00:00	usage	959.000	130215.00	0.0	124876185.00	0.00	124876185.00	Xuất tuần 4 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T1074	M016		P0001	2025-12-23	2025-12-23 15:00:00	return	165.000	58084.00	0.0	9583860.00	0.00	9583860.00	Trả vật tư dư cuối tháng từ Nhà xưởng Sunrise Long An	[]	
T1075	M012	S0017		2026-01-04	2026-01-04 12:00:00	purchase	3372.000	75790.00	10.0	255563880.00	25556388.00	281120268.00	Nhập kế hoạch tuần đầu tháng 1/2026	[]	
T1076	M005	S0020		2026-01-08	2026-01-08 08:00:00	purchase	8.562	24237207.00	10.0	207518966.33	20751896.63	228270862.97	Nhập kế hoạch tuần đầu tháng 1/2026	[]	
T1077	M013	S0023		2026-01-05	2026-01-05 12:00:00	purchase	13270.000	24944.00	10.0	331006880.00	33100688.00	364107568.00	Nhập kế hoạch tuần đầu tháng 1/2026	[]	
T1078	M018	S0026		2026-01-08	2026-01-08 10:00:00	purchase	160.000	1870255.00	10.0	299240800.00	29924080.00	329164880.00	Nhập kế hoạch tuần đầu tháng 1/2026	[]	
T1079	M020	S0029		2026-01-06	2026-01-06 09:00:00	purchase	2571.000	133292.00	10.0	342693732.00	34269373.20	376963105.20	Nhập kế hoạch tuần đầu tháng 1/2026	[]	
T1080	M004	S0002		2026-01-02	2026-01-02 11:00:00	purchase	6.089	23487351.00	10.0	143014480.24	14301448.02	157315928.26	Nhập kế hoạch tuần đầu tháng 1/2026	[]	
T1081	M006	S0005		2026-01-02	2026-01-02 11:00:00	purchase	7.414	24931704.00	10.0	184843653.46	18484365.35	203328018.80	Nhập kế hoạch tuần đầu tháng 1/2026	[]	
T1082	M019	S0008		2026-01-02	2026-01-02 11:00:00	purchase	111.000	1936315.00	10.0	214930965.00	21493096.50	236424061.50	Nhập theo chu kỳ dài Sơn phủ polyurethane xanh tháng 1/2026	[]	
T1083	M020		P0027	2026-01-05	2026-01-05 16:00:00	usage	1148.000	130984.00	0.0	150369632.00	0.00	150369632.00	Xuất tuần 1 cho Nhà máy cơ khí chính xác Biên Hòa	[]	
T1084	M004		P0028	2026-01-03	2026-01-03 10:00:00	usage	4.289	24099815.00	0.0	103364106.54	0.00	103364106.54	Xuất tuần 1 cho Kho lạnh thủy sản Vũng Tàu	[]	
T1085	M012		P0029	2026-01-06	2026-01-06 10:00:00	usage	1365.000	74690.00	0.0	101951850.00	0.00	101951850.00	Xuất tuần 1 cho Nhà xưởng phụ trợ Dĩ An	[]	
T1086	M006		P0030	2026-01-14	2026-01-14 10:00:00	usage	5.658	24257784.00	0.0	137250541.87	0.00	137250541.87	Xuất tuần 2 cho Trung tâm vận hành Đức Trọng	[]	
T1087	M005		P0031	2026-01-14	2026-01-14 17:00:00	usage	4.293	23656955.00	0.0	101559307.82	0.00	101559307.82	Xuất tuần 2 cho Nhà máy phân bón Long An	[]	
T1088	M005		P0032	2026-01-14	2026-01-14 15:00:00	usage	2.983	23656955.00	0.0	70568696.77	0.00	70568696.77	Xuất tuần 2 cho Kho vật tư công nghiệp Tân Tạo	[]	
T1089	M006		P0033	2026-01-13	2026-01-13 13:00:00	usage	4.044	24257784.00	0.0	98098478.50	0.00	98098478.50	Xuất tuần 2 cho Nhà xưởng sản xuất pallet	[]	
T1090	M013		P0034	2026-01-13	2026-01-13 12:00:00	usage	5632.000	24064.00	0.0	135528448.00	0.00	135528448.00	Xuất tuần 2 cho Nhà máy nông sản Cái Bè	[]	
T1091	M004		P0033	2026-01-20	2026-01-20 13:00:00	usage	3.305	24099815.00	0.0	79649888.58	0.00	79649888.58	Xuất tuần 3 cho Nhà xưởng sản xuất pallet	[]	
T1092	M005		P0034	2026-01-19	2026-01-19 16:00:00	usage	2.614	23656955.00	0.0	61839280.37	0.00	61839280.37	Xuất tuần 3 cho Nhà máy nông sản Cái Bè	[]	
T1093	M005	S0028		2026-01-21	2026-01-21 12:00:00	purchase	14.454	24853632.00	10.0	359234396.93	35923439.69	395157836.62	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 6mm	[]	
T1094	M005		P0034	2026-01-24	2026-01-24 13:00:00	usage	0.537	24015958.00	0.0	12896569.45	0.00	12896569.45	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T1095	M018		P0035	2026-01-17	2026-01-17 13:00:00	usage	45.000	1775577.00	0.0	79900965.00	0.00	79900965.00	Xuất tuần 3 cho Xưởng gia công thép Thủ Đức	[]	
T1096	M004		P0036	2026-01-21	2026-01-21 10:00:00	usage	4.655	24099815.00	0.0	112184638.83	0.00	112184638.83	Xuất tuần 3 cho Kho ngoại quan Hiệp Phước	[]	
T1097	M012		P0037	2026-01-16	2026-01-16 17:00:00	usage	1018.000	74690.00	0.0	76034420.00	0.00	76034420.00	Xuất tuần 3 cho Nhà máy điện mặt trời phụ trợ	[]	
T1098	M006		P0036	2026-01-26	2026-01-26 16:00:00	usage	2.349	24257784.00	0.0	56981534.62	0.00	56981534.62	Xuất tuần 4 cho Kho ngoại quan Hiệp Phước	[]	
T1099	M013		P0037	2026-01-28	2026-01-28 10:00:00	usage	1614.000	24064.00	0.0	38839296.00	0.00	38839296.00	Xuất tuần 4 cho Nhà máy điện mặt trời phụ trợ	[]	
T1100	M006		P0038	2026-01-28	2026-01-28 15:00:00	usage	1.665	24257784.00	0.0	40389210.36	0.00	40389210.36	Xuất tuần 4 cho Trung tâm bảo trì thiết bị	[]	
T1101	M006	S0003		2026-02-07	2026-02-07 14:00:00	purchase	11.213	24289616.00	10.0	272359464.21	27235946.42	299595410.63	Nhập kế hoạch tuần đầu tháng 2/2026	[]	
T1102	M010	S0009		2026-02-08	2026-02-08 08:00:00	purchase	9.563	24637779.00	8.0	235611080.58	18848886.45	254459967.02	Nhập kế hoạch tuần đầu tháng 2/2026	[]	
T1103	M008	S0015		2026-02-06	2026-02-06 08:00:00	purchase	5.838	29008008.00	8.0	169348750.70	13547900.06	182896650.76	Nhập kế hoạch tuần đầu tháng 2/2026	[]	
T1104	M009	S0024		2026-02-02	2026-02-02 12:00:00	purchase	10.839	25977296.00	10.0	281567911.34	28156791.13	309724702.48	Nhập kế hoạch tuần đầu tháng 2/2026	[]	
T1105	M010		P0032	2026-02-07	2026-02-07 12:00:00	usage	1.650	25744612.00	0.0	42478609.80	0.00	42478609.80	Xuất tuần 1 cho Kho vật tư công nghiệp Tân Tạo	[]	
T1106	M016		P0033	2026-02-02	2026-02-02 12:00:00	usage	829.000	58084.00	0.0	48151636.00	0.00	48151636.00	Xuất tuần 1 cho Nhà xưởng sản xuất pallet	[]	
T1107	M002		P0034	2026-02-03	2026-02-03 14:00:00	usage	0.504	27043367.00	0.0	13629856.97	0.00	13629856.97	Xuất tuần 1 cho Nhà máy nông sản Cái Bè	[]	
T1108	M002	S0030		2026-02-05	2026-02-05 11:00:00	purchase	4.915	28548021.00	10.0	140313523.22	14031352.32	154344875.54	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T1109	M002		P0034	2026-02-08	2026-02-08 15:00:00	usage	1.593	27494763.00	0.0	43799157.46	0.00	43799157.46	Xuất tiếp sau nhập bù cho Nhà máy nông sản Cái Bè	[]	
T1110	M001		P0035	2026-02-03	2026-02-03 09:00:00	usage	2.070	25916449.00	0.0	53647049.43	0.00	53647049.43	Xuất tuần 1 cho Xưởng gia công thép Thủ Đức	[]	
T1111	M009		P0036	2026-02-03	2026-02-03 09:00:00	usage	17.085	27110206.00	0.0	463177869.51	0.00	463177869.51	Xuất tuần 1 cho Kho ngoại quan Hiệp Phước	[]	
T1112	M009	S0002		2026-02-06	2026-02-06 13:00:00	purchase	21.504	29289757.00	10.0	629846934.53	62984693.45	692831627.98	Nhập bù sau khi gần cạn tồn Thép hộp 150x150x5	[]	
T1113	M009		P0036	2026-02-07	2026-02-07 12:00:00	usage	7.733	27764071.00	0.0	214699561.04	0.00	214699561.04	Xuất tiếp sau nhập bù cho Kho ngoại quan Hiệp Phước	[]	
T1114	M003		P0035	2026-02-13	2026-02-13 17:00:00	usage	4.341	23732318.00	0.0	103021992.44	0.00	103021992.44	Xuất tuần 2 cho Xưởng gia công thép Thủ Đức	[]	
T1115	M020		P0036	2026-02-11	2026-02-11 16:00:00	usage	874.000	130984.00	0.0	114480016.00	0.00	114480016.00	Xuất tuần 2 cho Kho ngoại quan Hiệp Phước	[]	
T1116	M019		P0037	2026-02-09	2026-02-09 13:00:00	usage	52.000	1998872.00	0.0	103941344.00	0.00	103941344.00	Xuất tuần 2 cho Nhà máy điện mặt trời phụ trợ	[]	
T1117	M008		P0038	2026-02-13	2026-02-13 17:00:00	usage	2.209	27411599.00	0.0	60552222.19	0.00	60552222.19	Xuất tuần 2 cho Trung tâm bảo trì thiết bị	[]	
T1118	M010		P0039	2026-02-11	2026-02-11 15:00:00	usage	3.638	25744612.00	0.0	93658898.46	0.00	93658898.46	Xuất tuần 2 cho Nhà máy chế biến gạo Sa Đéc	[]	
T1119	M020		P0040	2026-02-12	2026-02-12 16:00:00	usage	11264.000	130984.00	0.0	1475403776.00	0.00	1475403776.00	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T1120	M020	S0008		2026-02-21	2026-02-21 11:00:00	purchase	2140.000	129173.00	10.0	276430220.00	27643022.00	304073242.00	Nhập bù sau khi gần cạn tồn Xà gồ C150x50x20x2.0	[]	
T1121	M020		P0040	2026-02-22	2026-02-22 13:00:00	usage	646.000	130441.00	0.0	84264886.00	0.00	84264886.00	Xuất tiếp sau nhập bù cho Xưởng sản xuất container module	[]	
T1122	M016		P0038	2026-02-21	2026-02-21 14:00:00	usage	2557.000	58084.00	0.0	148520788.00	0.00	148520788.00	Xuất tuần 3 cho Trung tâm bảo trì thiết bị	[]	
T1123	M020		P0039	2026-02-17	2026-02-17 09:00:00	usage	966.000	130441.00	0.0	126006006.00	0.00	126006006.00	Xuất tuần 3 cho Nhà máy chế biến gạo Sa Đéc	[]	
T1124	M011		P0040	2026-02-17	2026-02-17 10:00:00	usage	5.518	27932999.00	0.0	154134288.48	0.00	154134288.48	Xuất tuần 3 cho Xưởng sản xuất container module	[]	
T1125	M002		P0001	2026-02-21	2026-02-21 11:00:00	usage	3.322	27494763.00	0.0	91337602.69	0.00	91337602.69	Xuất tuần 3 cho Nhà xưởng Sunrise Long An	[]	
T1126	M002	S0011		2026-02-25	2026-02-25 11:00:00	purchase	31.217	26560449.00	10.0	829137536.43	82913753.64	912051290.08	Nhập bù sau khi gần cạn tồn Thép hình H300x300x10x15	[]	
T1127	M002		P0001	2026-02-28	2026-02-28 13:00:00	usage	12.468	27214469.00	0.0	339309999.49	0.00	339309999.49	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T1128	M006		P0001	2026-02-23	2026-02-23 16:00:00	usage	3.178	24265742.00	0.0	77116528.08	0.00	77116528.08	Xuất tuần 4 cho Nhà xưởng Sunrise Long An	[]	
T1129	M001		P0002	2026-02-23	2026-02-23 13:00:00	usage	2.491	25916449.00	0.0	64557874.46	0.00	64557874.46	Xuất tuần 4 cho Kho lạnh Mekong Logistics	[]	
T1130	M019		P0003	2026-02-25	2026-02-25 11:00:00	usage	36.000	1998872.00	0.0	71959392.00	0.00	71959392.00	Xuất tuần 4 cho Nhà máy bao bì Tân Phú	[]	
T1131	M009		P0004	2026-02-26	2026-02-26 17:00:00	usage	3.195	27764071.00	0.0	88706206.85	0.00	88706206.85	Xuất tuần 4 cho Xưởng cơ khí Bình Dương	[]	
T1132	M020		P0005	2026-02-23	2026-02-23 14:00:00	usage	503.000	130441.00	0.0	65611823.00	0.00	65611823.00	Xuất tuần 4 cho Trung tâm phân phối An Sương	[]	
T1133	M001		P0006	2026-02-25	2026-02-25 17:00:00	usage	14.496	25916449.00	0.0	375684844.70	0.00	375684844.70	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T1134	M001	S0018		2026-02-28	2026-02-28 12:00:00	purchase	46.887	26181214.00	10.0	1227558580.82	122755858.08	1350314438.90	Nhập bù sau khi gần cạn tồn Thép hình H200x200x8x12	[]	
T1135	M001		P0006	2026-02-28	2026-02-28 13:00:00	usage	12.644	25995878.00	0.0	328691881.43	0.00	328691881.43	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T1136	M005	S0001		2026-03-08	2026-03-08 09:00:00	purchase	21.066	24818964.00	10.0	522836295.62	52283629.56	575119925.19	Nhập kế hoạch tuần đầu tháng 3/2026	[]	
T1137	M004	S0007		2026-03-06	2026-03-06 15:00:00	purchase	27.205	23392087.00	10.0	636381726.83	63638172.68	700019899.52	Nhập kế hoạch tuần đầu tháng 3/2026	[]	
T1138	M016	S0010		2026-03-01	2026-03-01 08:00:00	purchase	8767.000	60327.00	10.0	528886809.00	52888680.90	581775489.90	Nhập kế hoạch tuần đầu tháng 3/2026	[]	
T1139	M009	S0013		2026-03-02	2026-03-02 10:00:00	purchase	23.361	27872695.00	8.0	651134027.90	52090722.23	703224750.13	Nhập kế hoạch tuần đầu tháng 3/2026	[]	
T1140	M006	S0019		2026-03-06	2026-03-06 12:00:00	purchase	15.625	24794643.00	10.0	387416296.88	38741629.69	426157926.56	Nhập kế hoạch tuần đầu tháng 3/2026	[]	
T1141	M015	S0001		2026-03-06	2026-03-06 08:00:00	purchase	7444.000	50584.00	10.0	376547296.00	37654729.60	414202025.60	Nhập kế hoạch tuần đầu tháng 3/2026	[]	
T1142	M018	S0004		2026-03-07	2026-03-07 08:00:00	purchase	377.000	1727044.00	8.0	651095588.00	52087647.04	703183235.04	Nhập kế hoạch tuần đầu tháng 3/2026	[]	
T1143	M015		P0037	2026-03-05	2026-03-05 09:00:00	usage	3906.000	48041.00	0.0	187648146.00	0.00	187648146.00	Xuất tuần 1 cho Nhà máy điện mặt trời phụ trợ	[]	
T1144	M006		P0038	2026-03-06	2026-03-06 16:00:00	usage	6.007	24397967.00	0.0	146558587.77	0.00	146558587.77	Xuất tuần 1 cho Trung tâm bảo trì thiết bị	[]	
T1145	M007		P0039	2026-03-04	2026-03-04 12:00:00	usage	8.577	25242126.00	0.0	216501714.70	0.00	216501714.70	Xuất tuần 1 cho Nhà máy chế biến gạo Sa Đéc	[]	
T1146	M006		P0040	2026-03-07	2026-03-07 11:00:00	usage	9.781	24397967.00	0.0	238636515.23	0.00	238636515.23	Xuất tuần 1 cho Xưởng sản xuất container module	[]	
T1147	M017		P0001	2026-03-07	2026-03-07 15:00:00	usage	6592.000	43853.00	0.0	289078976.00	0.00	289078976.00	Xuất tuần 1 cho Nhà xưởng Sunrise Long An	[]	
T1148	M006		P0002	2026-03-02	2026-03-02 16:00:00	usage	8.465	24397967.00	0.0	206528790.66	0.00	206528790.66	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T1149	M018		P0040	2026-03-09	2026-03-09 12:00:00	usage	70.000	1763444.00	0.0	123441080.00	0.00	123441080.00	Xuất tuần 2 cho Xưởng sản xuất container module	[]	
T1150	M007		P0001	2026-03-12	2026-03-12 17:00:00	usage	2.764	25242126.00	0.0	69769236.26	0.00	69769236.26	Xuất tuần 2 cho Nhà xưởng Sunrise Long An	[]	
T1151	M007	S0015		2026-03-18	2026-03-18 12:00:00	purchase	13.942	27237603.00	10.0	379746661.03	37974666.10	417721327.13	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T1152	M007		P0001	2026-03-20	2026-03-20 12:00:00	usage	3.539	25840769.00	0.0	91450481.49	0.00	91450481.49	Xuất tiếp sau nhập bù cho Nhà xưởng Sunrise Long An	[]	
T1153	M015		P0002	2026-03-11	2026-03-11 16:00:00	usage	3562.000	48041.00	0.0	171122042.00	0.00	171122042.00	Xuất tuần 2 cho Kho lạnh Mekong Logistics	[]	
T1154	M002		P0003	2026-03-14	2026-03-14 16:00:00	usage	5.317	27214469.00	0.0	144699331.67	0.00	144699331.67	Xuất tuần 2 cho Nhà máy bao bì Tân Phú	[]	
T1155	M006		P0003	2026-03-17	2026-03-17 14:00:00	usage	5.872	24397967.00	0.0	143264862.22	0.00	143264862.22	Xuất tuần 3 cho Nhà máy bao bì Tân Phú	[]	
T1156	M002		P0004	2026-03-18	2026-03-18 12:00:00	usage	6.413	27214469.00	0.0	174526389.70	0.00	174526389.70	Xuất tuần 3 cho Xưởng cơ khí Bình Dương	[]	
T1157	M005		P0005	2026-03-16	2026-03-16 17:00:00	usage	6.520	24216710.00	0.0	157892949.20	0.00	157892949.20	Xuất tuần 3 cho Trung tâm phân phối An Sương	[]	
T1158	M005		P0006	2026-03-18	2026-03-18 15:00:00	usage	6.529	24216710.00	0.0	158110899.59	0.00	158110899.59	Xuất tuần 3 cho Nhà máy thực phẩm GreenFarm	[]	
T1159	M002		P0007	2026-03-21	2026-03-21 13:00:00	usage	5.673	27214469.00	0.0	154387682.64	0.00	154387682.64	Xuất tuần 3 cho Kho thép Phú Mỹ	[]	
T1160	M011		P0006	2026-03-23	2026-03-23 11:00:00	usage	2.871	27932999.00	0.0	80195640.13	0.00	80195640.13	Xuất tuần 4 cho Nhà máy thực phẩm GreenFarm	[]	
T1161	M011	S0024		2026-03-25	2026-03-25 12:00:00	purchase	8.119	28674812.00	10.0	232810798.63	23281079.86	256091878.49	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T1162	M011		P0006	2026-03-27	2026-03-27 15:00:00	usage	1.959	28155543.00	0.0	55156708.74	0.00	55156708.74	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T1163	M009		P0007	2026-03-23	2026-03-23 10:00:00	usage	9.122	27791227.00	0.0	253511572.69	0.00	253511572.69	Xuất tuần 4 cho Kho thép Phú Mỹ	[]	
T1164	M016		P0008	2026-03-25	2026-03-25 12:00:00	usage	3001.000	58645.00	0.0	175993645.00	0.00	175993645.00	Xuất tuần 4 cho Nhà xưởng may Phước Đông	[]	
T1165	M004		P0037	2026-03-31	2026-03-31 15:00:00	return	6.864	23922883.00	0.0	164206668.91	0.00	164206668.91	Trả vật tư dư cuối tháng từ Nhà máy điện mặt trời phụ trợ	[]	
T1166	M003	S0014		2026-04-08	2026-04-08 10:00:00	purchase	25.140	23889348.00	8.0	600578208.72	48046256.70	648624465.42	Nhập kế hoạch tuần đầu tháng 4/2026	[]	
T1167	M012	S0023		2026-04-02	2026-04-02 13:00:00	purchase	4824.000	70984.00	8.0	342426816.00	27394145.28	369820961.28	Nhập kế hoạch tuần đầu tháng 4/2026	[]	
T1168	M014	S0011		2026-04-02	2026-04-02 15:00:00	purchase	18730.000	29014.00	10.0	543432220.00	54343222.00	597775442.00	Nhập theo chu kỳ dài Bu lông cường độ cao M22x80 tháng 4/2026	[]	
T1169	M001	S0017		2026-04-07	2026-04-07 14:00:00	purchase	12.261	26685602.00	10.0	327192166.12	32719216.61	359911382.73	Nhập kế hoạch tuần đầu tháng 4/2026	[]	
T1170	M017		P0002	2026-04-07	2026-04-07 17:00:00	usage	3105.000	43853.00	0.0	136163565.00	0.00	136163565.00	Xuất tuần 1 cho Kho lạnh Mekong Logistics	[]	
T1171	M003		P0003	2026-04-02	2026-04-02 17:00:00	usage	6.923	23771576.00	0.0	164570620.65	0.00	164570620.65	Xuất tuần 1 cho Nhà máy bao bì Tân Phú	[]	
T1172	M019		P0004	2026-04-03	2026-04-03 17:00:00	usage	65.000	1998872.00	0.0	129926680.00	0.00	129926680.00	Xuất tuần 1 cho Xưởng cơ khí Bình Dương	[]	
T1173	M001		P0005	2026-04-02	2026-04-02 14:00:00	usage	8.707	26168309.00	0.0	227847466.46	0.00	227847466.46	Xuất tuần 1 cho Trung tâm phân phối An Sương	[]	
T1174	M019	S0024		2026-04-12	2026-04-12 14:00:00	purchase	212.000	2032670.00	10.0	430926040.00	43092604.00	474018644.00	Nhập bù sau khi gần cạn tồn Sơn phủ polyurethane xanh	[]	
T1175	M019		P0006	2026-04-14	2026-04-14 09:00:00	usage	55.000	2009011.00	0.0	110495605.00	0.00	110495605.00	Xuất tiếp sau nhập bù cho Nhà máy thực phẩm GreenFarm	[]	
T1176	M010		P0007	2026-04-05	2026-04-05 11:00:00	usage	6.337	25744612.00	0.0	163143606.24	0.00	163143606.24	Xuất tuần 1 cho Kho thép Phú Mỹ	[]	
T1177	M011		P0005	2026-04-09	2026-04-09 15:00:00	usage	6.160	28155543.00	0.0	173438144.88	0.00	173438144.88	Xuất tuần 2 cho Trung tâm phân phối An Sương	[]	
T1178	M011	S0025		2026-04-16	2026-04-16 13:00:00	purchase	10.139	29705080.00	10.0	301179806.12	30117980.61	331297786.73	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T1179	M011		P0005	2026-04-19	2026-04-19 15:00:00	usage	2.393	28620404.00	0.0	68488626.77	0.00	68488626.77	Xuất tiếp sau nhập bù cho Trung tâm phân phối An Sương	[]	
T1180	M004		P0006	2026-04-10	2026-04-10 13:00:00	usage	4.647	23922883.00	0.0	111169637.30	0.00	111169637.30	Xuất tuần 2 cho Nhà máy thực phẩm GreenFarm	[]	
T1181	M011		P0007	2026-04-12	2026-04-12 16:00:00	usage	7.288	28620404.00	0.0	208585504.35	0.00	208585504.35	Xuất tuần 2 cho Kho thép Phú Mỹ	[]	
T1182	M017		P0008	2026-04-17	2026-04-17 17:00:00	usage	3182.000	43853.00	0.0	139540246.00	0.00	139540246.00	Xuất tuần 3 cho Nhà xưởng may Phước Đông	[]	
T1183	M013		P0009	2026-04-16	2026-04-16 15:00:00	usage	13293.000	24064.00	0.0	319882752.00	0.00	319882752.00	Xuất tuần 3 cho Nhà máy nhựa Nam Việt	[]	
T1184	M004		P0010	2026-04-20	2026-04-20 12:00:00	usage	8.349	23922883.00	0.0	199732150.17	0.00	199732150.17	Xuất tuần 3 cho Khu bảo trì xe buýt Củ Chi	[]	
T1185	M014		P0011	2026-04-20	2026-04-20 12:00:00	usage	9227.000	28119.00	0.0	259454013.00	0.00	259454013.00	Xuất tuần 3 cho Nhà máy gỗ Đức Hòa	[]	
T1186	M016		P0012	2026-04-20	2026-04-20 15:00:00	usage	4566.000	58645.00	0.0	267773070.00	0.00	267773070.00	Xuất tuần 3 cho Kho tổng hợp Sóng Thần	[]	
T1187	M013		P0011	2026-04-26	2026-04-26 10:00:00	usage	5450.000	24064.00	0.0	131148800.00	0.00	131148800.00	Xuất tuần 4 cho Nhà máy gỗ Đức Hòa	[]	
T1188	M017		P0012	2026-04-23	2026-04-23 15:00:00	usage	3398.000	43853.00	0.0	149012494.00	0.00	149012494.00	Xuất tuần 4 cho Kho tổng hợp Sóng Thần	[]	
T1189	M010		P0013	2026-04-27	2026-04-27 14:00:00	usage	6.948	25744612.00	0.0	178873564.18	0.00	178873564.18	Xuất tuần 4 cho Nhà xưởng điện tử VSIP	[]	
T1190	M011		P0014	2026-04-28	2026-04-28 16:00:00	usage	0.458	28620404.00	0.0	13108145.03	0.00	13108145.03	Xuất tuần 4 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T1191	M011	S0008		2026-04-30	2026-04-30 11:00:00	purchase	27.032	27873257.00	10.0	753469883.22	75346988.32	828816871.55	Nhập bù sau khi gần cạn tồn Ống thép D114x4.0	[]	
T1192	M011		P0014	2026-04-30	2026-04-30 16:00:00	usage	7.712	28396260.00	0.0	218991957.12	0.00	218991957.12	Xuất tiếp sau nhập bù cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T1193	M017		P0015	2026-04-26	2026-04-26 11:00:00	usage	3392.000	43853.00	0.0	148749376.00	0.00	148749376.00	Xuất tuần 4 cho Kho hàng cảng Cát Lái	[]	
T1194	M019		P0016	2026-04-24	2026-04-24 15:00:00	usage	145.000	2009011.00	0.0	291306595.00	0.00	291306595.00	Xuất tuần 4 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T1195	M012	S0015		2026-05-07	2026-05-07 11:00:00	purchase	6237.000	74956.00	10.0	467500572.00	46750057.20	514250629.20	Nhập kế hoạch tuần đầu tháng 5/2026	[]	
T1196	M015	S0027		2026-05-06	2026-05-06 15:00:00	purchase	5379.000	48570.00	10.0	261258030.00	26125803.00	287383833.00	Nhập kế hoạch tuần đầu tháng 5/2026	[]	
T1197	M001	S0003		2026-05-06	2026-05-06 13:00:00	purchase	10.591	25520964.00	10.0	270292529.72	27029252.97	297321782.70	Nhập kế hoạch tuần đầu tháng 5/2026	[]	
T1198	M016	S0006		2026-05-03	2026-05-03 10:00:00	purchase	5321.000	58834.00	10.0	313055714.00	31305571.40	344361285.40	Nhập kế hoạch tuần đầu tháng 5/2026	[]	
T1199	M013	S0015		2026-05-07	2026-05-07 08:00:00	purchase	16738.000	23618.00	10.0	395318084.00	39531808.40	434849892.40	Nhập kế hoạch tuần đầu tháng 5/2026	[]	
T1200	M018	S0021		2026-05-06	2026-05-06 12:00:00	purchase	294.000	1691357.00	10.0	497258958.00	49725895.80	546984853.80	Nhập kế hoạch tuần đầu tháng 5/2026	[]	
T1201	M001		P0007	2026-05-07	2026-05-07 16:00:00	usage	3.306	26006473.00	0.0	85977399.74	0.00	85977399.74	Xuất tuần 1 cho Kho thép Phú Mỹ	[]	
T1202	M008		P0008	2026-05-07	2026-05-07 17:00:00	usage	2.183	27411599.00	0.0	59839520.62	0.00	59839520.62	Xuất tuần 1 cho Nhà xưởng may Phước Đông	[]	
T1203	M005		P0009	2026-05-03	2026-05-03 10:00:00	usage	2.351	24216710.00	0.0	56933485.21	0.00	56933485.21	Xuất tuần 1 cho Nhà máy nhựa Nam Việt	[]	
T1204	M016		P0010	2026-05-14	2026-05-14 12:00:00	usage	3171.000	58692.00	0.0	186112332.00	0.00	186112332.00	Xuất tuần 2 cho Khu bảo trì xe buýt Củ Chi	[]	
T1205	M007		P0011	2026-05-10	2026-05-10 15:00:00	usage	4.993	25840769.00	0.0	129022959.62	0.00	129022959.62	Xuất tuần 2 cho Nhà máy gỗ Đức Hòa	[]	
T1206	M005		P0012	2026-05-12	2026-05-12 13:00:00	usage	6.345	24216710.00	0.0	153655024.95	0.00	153655024.95	Xuất tuần 2 cho Kho tổng hợp Sóng Thần	[]	
T1207	M018		P0013	2026-05-16	2026-05-16 12:00:00	usage	68.000	1745422.00	0.0	118688696.00	0.00	118688696.00	Xuất tuần 3 cho Nhà xưởng điện tử VSIP	[]	
T1208	M015		P0014	2026-05-17	2026-05-17 11:00:00	usage	3358.000	48173.00	0.0	161764934.00	0.00	161764934.00	Xuất tuần 3 cho Nhà máy thức ăn chăn nuôi Đồng Nai	[]	
T1209	M007		P0015	2026-05-18	2026-05-18 12:00:00	usage	5.410	25840769.00	0.0	139798560.29	0.00	139798560.29	Xuất tuần 3 cho Kho hàng cảng Cát Lái	[]	
T1210	M007	S0013		2026-05-21	2026-05-21 12:00:00	purchase	4.155	27000489.00	10.0	112187031.80	11218703.18	123405734.97	Nhập bù sau khi gần cạn tồn Thép tấm SS400 dày 16mm	[]	
T1211	M007		P0015	2026-05-24	2026-05-24 16:00:00	usage	0.566	26188685.00	0.0	14822795.71	0.00	14822795.71	Xuất tiếp sau nhập bù cho Kho hàng cảng Cát Lái	[]	
T1212	M005		P0016	2026-05-21	2026-05-21 17:00:00	usage	8.410	24216710.00	0.0	203662531.10	0.00	203662531.10	Xuất tuần 3 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T1213	M011		P0016	2026-05-26	2026-05-26 11:00:00	usage	4.641	28396260.00	0.0	131787042.66	0.00	131787042.66	Xuất tuần 4 cho Xưởng sản xuất nội thất Hóc Môn	[]	
T1214	M008		P0017	2026-05-24	2026-05-24 09:00:00	usage	5.810	27411599.00	0.0	159261390.19	0.00	159261390.19	Xuất tuần 4 cho Nhà máy dược phẩm Tân Uyên	[]	
T1215	M001		P0018	2026-05-26	2026-05-26 14:00:00	usage	3.608	26006473.00	0.0	93831354.58	0.00	93831354.58	Xuất tuần 4 cho Trạm logistics Nhơn Trạch	[]	
T1216	M011		P0007	2026-05-31	2026-05-31 15:00:00	return	2.651	28396260.00	0.0	75278485.26	0.00	75278485.26	Trả vật tư dư cuối tháng từ Kho thép Phú Mỹ	[]	
T1217	K0001		P0001	2025-01-12	2025-01-12 09:00:00	structure_export	2.000	8500000.00	0.0	17000000.00	0.00	17000000.00	Xuất cấu kiện Cột biên CB-01	[]	
T1218	K0002		P0002	2025-02-12	2025-02-12 09:00:00	structure_export	3.000	9750000.00	0.0	29250000.00	0.00	29250000.00	Xuất cấu kiện Cột giữa CG-02	[]	
T1219	K0003		P0003	2025-03-12	2025-03-12 09:00:00	structure_export	4.000	11000000.00	0.0	44000000.00	0.00	44000000.00	Xuất cấu kiện Kèo chính KC-01	[]	
T1220	K0004		P0004	2025-04-12	2025-04-12 09:00:00	structure_export	5.000	12250000.00	0.0	61250000.00	0.00	61250000.00	Xuất cấu kiện Kèo phụ KP-02	[]	
T1221	K0005		P0005	2025-05-12	2025-05-12 09:00:00	structure_export	6.000	13500000.00	0.0	81000000.00	0.00	81000000.00	Xuất cấu kiện Dầm cầu trục DCT-01	[]	
T1222	K0006		P0006	2025-06-12	2025-06-12 09:00:00	structure_export	2.000	14750000.00	0.0	29500000.00	0.00	29500000.00	Xuất cấu kiện Xà gồ mái XGM-01	[]	
T1223	K0007		P0007	2025-07-12	2025-07-12 09:00:00	structure_export	3.000	16000000.00	0.0	48000000.00	0.00	48000000.00	Xuất cấu kiện Xà gồ vách XGV-01	[]	
T1224	K0008		P0008	2025-08-12	2025-08-12 09:00:00	structure_export	4.000	17250000.00	0.0	69000000.00	0.00	69000000.00	Xuất cấu kiện Giằng mái GM-01	[]	
T1225	K0009		P0009	2025-09-12	2025-09-12 09:00:00	structure_export	5.000	18500000.00	0.0	92500000.00	0.00	92500000.00	Xuất cấu kiện Giằng cột GC-01	[]	
T1226	K0010		P0010	2025-10-12	2025-10-12 09:00:00	structure_export	6.000	19750000.00	0.0	118500000.00	0.00	118500000.00	Xuất cấu kiện Dầm sàn DS-01	[]	
T1227	K0011		P0011	2025-11-12	2025-11-12 09:00:00	structure_export	2.000	8500000.00	0.0	17000000.00	0.00	17000000.00	Xuất cấu kiện Bản mã chân cột BMC-01	[]	
T1228	K0012		P0012	2025-12-12	2025-12-12 09:00:00	structure_export	3.000	9750000.00	0.0	29250000.00	0.00	29250000.00	Xuất cấu kiện Bản mã liên kết BMLK-01	[]	
T1229	K0013		P0013	2025-01-12	2025-01-12 09:00:00	structure_export	4.000	11000000.00	0.0	44000000.00	0.00	44000000.00	Xuất cấu kiện Lan can thép LC-01	[]	
T1230	K0014		P0014	2025-02-12	2025-02-12 09:00:00	structure_export	5.000	12250000.00	0.0	61250000.00	0.00	61250000.00	Xuất cấu kiện Cầu thang thép CT-01	[]	
T1231	K0015		P0015	2025-03-12	2025-03-12 09:00:00	structure_export	6.000	13500000.00	0.0	81000000.00	0.00	81000000.00	Xuất cấu kiện Khung cửa trời KCT-01	[]	
T1232	K0016		P0016	2025-04-12	2025-04-12 09:00:00	structure_export	2.000	14750000.00	0.0	29500000.00	0.00	29500000.00	Xuất cấu kiện Mái canopy MCP-01	[]	
T1233	K0017		P0017	2025-05-12	2025-05-12 09:00:00	structure_export	3.000	16000000.00	0.0	48000000.00	0.00	48000000.00	Xuất cấu kiện Khung đỡ thiết bị KDTB-01	[]	
T1234	K0018		P0018	2025-06-12	2025-06-12 09:00:00	structure_export	4.000	17250000.00	0.0	69000000.00	0.00	69000000.00	Xuất cấu kiện Sàn thao tác STT-01	[]	
T1235	K0019		P0019	2025-07-12	2025-07-12 09:00:00	structure_export	5.000	18500000.00	0.0	92500000.00	0.00	92500000.00	Xuất cấu kiện Dầm phụ DP-01	[]	
T1236	K0020		P0020	2025-08-12	2025-08-12 09:00:00	structure_export	6.000	19750000.00	0.0	118500000.00	0.00	118500000.00	Xuất cấu kiện Kèo đầu hồi KDH-01	[]	
T1237	K0021		P0021	2025-09-12	2025-09-12 09:00:00	structure_export	2.000	8500000.00	0.0	17000000.00	0.00	17000000.00	Xuất cấu kiện Cột hồi CH-01	[]	
T1238	K0022		P0022	2025-10-12	2025-10-12 09:00:00	structure_export	3.000	9750000.00	0.0	29250000.00	0.00	29250000.00	Xuất cấu kiện Giằng xà gồ GXG-01	[]	
T1239	K0023		P0023	2025-11-12	2025-11-12 09:00:00	structure_export	4.000	11000000.00	0.0	44000000.00	0.00	44000000.00	Xuất cấu kiện Thanh chống TC-01	[]	
T1240	K0024		P0024	2025-12-12	2025-12-12 09:00:00	structure_export	5.000	12250000.00	0.0	61250000.00	0.00	61250000.00	Xuất cấu kiện Bệ đỡ máy BDM-01	[]	
T1241	K0025		P0025	2025-01-12	2025-01-12 09:00:00	structure_export	6.000	13500000.00	0.0	81000000.00	0.00	81000000.00	Xuất cấu kiện Khung vách KV-01	[]	
T1242	K0026		P0026	2025-02-12	2025-02-12 09:00:00	structure_export	2.000	14750000.00	0.0	29500000.00	0.00	29500000.00	Xuất cấu kiện Máng xối thép MX-01	[]	
T1243	K0027		P0027	2025-03-12	2025-03-12 09:00:00	structure_export	3.000	16000000.00	0.0	48000000.00	0.00	48000000.00	Xuất cấu kiện Khung mái phụ KMP-01	[]	
T1244	K0028		P0028	2025-04-12	2025-04-12 09:00:00	structure_export	4.000	17250000.00	0.0	69000000.00	0.00	69000000.00	Xuất cấu kiện Dầm treo DT-01	[]	
T1245	K0029		P0029	2025-05-12	2025-05-12 09:00:00	structure_export	5.000	18500000.00	0.0	92500000.00	0.00	92500000.00	Xuất cấu kiện Bậc thang BT-01	[]	
T1246	K0030		P0030	2025-06-12	2025-06-12 09:00:00	structure_export	6.000	19750000.00	0.0	118500000.00	0.00	118500000.00	Xuất cấu kiện Thanh neo TN-01	[]	
tvskh2605181402001	M006		P0001	2026-05-18	2026-05-18 14:02:30	usage	30.000	24397967.00	\N	\N	\N	731939010.00		[{"path":"/uploads/usage/usage_1779087765141_et1o_1779087765538.png","name":"ChatGPT Image 11_59_50 18 thg 5, 2026.png"}]	\N
tvskh2605180703051995	M001	\N	\N	2026-05-18	2026-05-18 14:03:00	transfer_sw	12.000	\N	\N	\N	\N	0.00	Chuyển sang kho cấu kiện	\N	\N
tvskh2605180704159804	M010	\N	\N	2026-05-18	2026-05-18 14:03:00	transfer_sw	9.455	\N	\N	\N	\N	0.00	Chuyển sang kho cấu kiện	\N	\N
tvskh2605181418001	M020	S0001		2026-05-18	2026-05-18 14:17:31	purchase	2222.000	190441.00	10.0	423159902.00	42315990.20	465475892.20	test file	[{"path":"/uploads/purchase/purchase_1779088679895_6anc_1779088680281.png","name":"Ý tưởng cho quản lý kho.png"},{"path":"/uploads/purchase/purchase_1779088687678_6sot_1779088688018.xls","name":"DANH MUC THIET BI.xls"}]	\N
tvskh2605181423001	M010	S0001		2026-05-18	2026-05-18 14:23:28	purchase	333.000	25744612.00	10.0	8572955796.00	857295579.60	9430251375.60	D90	[{"path":"/uploads/purchase/purchase_1779089021349_dq9s_1779089021602.jpg","name":"login-factory-bg.jpg"}]	\N
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, name) FROM stdin;
113	bộ
114	cái
115	kg
116	mét
117	tấm
118	tấn
119	thùng
\.


--
-- Data for Name: users_table; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_table (id, name, username, password, role, permissions) FROM stdin;
u2	Nhân viên kho	staff	staff123	user	{"canExport": true, "canImport": true}
u1	Admin	admin	1	admin	{"canExport": true, "canImport": true, "canEditMaterial": true, "canDeleteProject": true, "canAccessSettings": true, "canCreateMaterial": true, "canDeleteMaterial": true, "canManageSupplier": true}
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 136, true);


--
-- Name: structure_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.structure_materials_id_seq', 90, true);


--
-- Name: sw_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sw_logs_id_seq', 5, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_id_seq', 119, true);


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
-- Name: idx_structure_materials_material_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_structure_materials_material_id ON public.structure_materials USING btree (material_id);


--
-- Name: idx_structure_materials_structure_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_structure_materials_structure_id ON public.structure_materials USING btree (structure_id);


--
-- Name: idx_structures_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_structures_name ON public.structures USING btree (name);


--
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);


--
-- Name: idx_suppliers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_phone ON public.suppliers USING btree (phone);


--
-- Name: idx_sw_logs_material_id_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sw_logs_material_id_created_at ON public.sw_logs USING btree (material_id, created_at DESC);


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

\unrestrict n7t5lxiClPrPubsdaT4XFkQ4zzLEOuVVQ1KKFL17qqW9NZsbaa6ltqdpNHEP3qr

