-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.dhaka_boundary (
  id integer NOT NULL DEFAULT nextval('dhaka_boundary_id_seq'::regclass),
  geom USER-DEFINED,
  CONSTRAINT dhaka_boundary_pkey PRIMARY KEY (id)
);
CREATE TABLE public.driver (
  driver_id bigint NOT NULL DEFAULT nextval('driver_driver_id_seq'::regclass),
  user_id bigint UNIQUE,
  license_no character varying NOT NULL,
  status character varying DEFAULT 'Available'::character varying,
  CONSTRAINT driver_pkey PRIMARY KEY (driver_id),
  CONSTRAINT driver_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.dropoff_request (
  dropoff_id bigint NOT NULL DEFAULT nextval('dropoff_request_dropoff_id_seq'::regclass),
  employee_id bigint,
  zone_id bigint,
  route_id bigint,
  drop_lat numeric,
  drop_lng numeric,
  shift_end_time time without time zone,
  service_date date NOT NULL,
  status character varying DEFAULT 'Pending'::character varying,
  drop_time time without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT dropoff_request_pkey PRIMARY KEY (dropoff_id),
  CONSTRAINT dropoff_request_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id),
  CONSTRAINT dropoff_request_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(zone_id),
  CONSTRAINT dropoff_request_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.route(route_id)
);
CREATE TABLE public.employee (
  employee_id bigint NOT NULL DEFAULT nextval('employee_employee_id_seq'::regclass),
  user_id bigint UNIQUE,
  home_lat numeric,
  home_lng numeric,
  is_active boolean DEFAULT true,
  CONSTRAINT employee_pkey PRIMARY KEY (employee_id),
  CONSTRAINT employee_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.pickup_request (
  pickup_id bigint NOT NULL DEFAULT nextval('pickup_request_pickup_id_seq'::regclass),
  employee_id bigint,
  zone_id bigint,
  route_id bigint,
  pickup_lat numeric,
  pickup_lng numeric,
  shift_start_time time without time zone,
  service_date date NOT NULL,
  request_type character varying CHECK (request_type::text = ANY (ARRAY['Regular'::character varying, 'Ad-hoc'::character varying]::text[])),
  status character varying DEFAULT 'Pending'::character varying CHECK (status::text = ANY (ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying]::text[])),
  pickup_time time without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pickup_request_pkey PRIMARY KEY (pickup_id),
  CONSTRAINT pickup_request_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id),
  CONSTRAINT pickup_request_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(zone_id),
  CONSTRAINT pickup_request_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.route(route_id)
);
CREATE TABLE public.route (
  route_id bigint NOT NULL DEFAULT nextval('route_route_id_seq'::regclass),
  zone_id bigint,
  route_type character varying CHECK (route_type::text = ANY (ARRAY['pickup'::character varying, 'dropoff'::character varying]::text[])),
  service_date date NOT NULL,
  shift_time time without time zone,
  total_distance_km numeric,
  total_travel_time_min integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT route_pkey PRIMARY KEY (route_id),
  CONSTRAINT route_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(zone_id)
);
CREATE TABLE public.route_assignment (
  assignment_id bigint NOT NULL DEFAULT nextval('route_assignment_assignment_id_seq'::regclass),
  route_id bigint UNIQUE,
  vehicle_id bigint,
  driver_id bigint,
  departure_time time without time zone,
  arrival_time time without time zone,
  status character varying,
  CONSTRAINT route_assignment_pkey PRIMARY KEY (assignment_id),
  CONSTRAINT route_assignment_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.route(route_id),
  CONSTRAINT route_assignment_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vehicle_id),
  CONSTRAINT route_assignment_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.driver(driver_id)
);
CREATE TABLE public.route_stop (
  stop_id bigint NOT NULL DEFAULT nextval('route_stop_stop_id_seq'::regclass),
  route_id bigint,
  latitude numeric,
  longitude numeric,
  sequence_order integer NOT NULL,
  arrival_time time without time zone,
  departure_time time without time zone,
  CONSTRAINT route_stop_pkey PRIMARY KEY (stop_id),
  CONSTRAINT route_stop_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.route(route_id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.stop_passenger (
  id bigint NOT NULL DEFAULT nextval('stop_passenger_id_seq'::regclass),
  stop_id bigint,
  employee_id bigint,
  boarded_status boolean DEFAULT false,
  CONSTRAINT stop_passenger_pkey PRIMARY KEY (id),
  CONSTRAINT stop_passenger_stop_id_fkey FOREIGN KEY (stop_id) REFERENCES public.route_stop(stop_id),
  CONSTRAINT stop_passenger_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id)
);
CREATE TABLE public.users (
  user_id bigint NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  password_hash text NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['Employee'::character varying::text, 'Driver'::character varying::text, 'Admin'::character varying::text])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status character varying DEFAULT 'Active'::character varying,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.vehicle (
  vehicle_id bigint NOT NULL DEFAULT nextval('vehicle_vehicle_id_seq'::regclass),
  plate_no character varying NOT NULL UNIQUE,
  capacity integer NOT NULL CHECK (capacity > 0),
  parking_lat numeric,
  parking_lng numeric,
  status character varying DEFAULT 'Active'::character varying,
  driver_id bigint,
  CONSTRAINT vehicle_pkey PRIMARY KEY (vehicle_id),
  CONSTRAINT vehicle_driver_fk FOREIGN KEY (driver_id) REFERENCES public.driver(driver_id)
);
CREATE TABLE public.zone (
  zone_id bigint NOT NULL DEFAULT nextval('zone_zone_id_seq'::regclass),
  zone_name character varying NOT NULL,
  description text,
  CONSTRAINT zone_pkey PRIMARY KEY (zone_id)
);