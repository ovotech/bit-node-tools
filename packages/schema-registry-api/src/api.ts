import { Schema } from 'avsc';
import fetch, { Request, RequestInit } from 'node-fetch';
import { SchemaRegistryError } from './';

interface SchemaResponse {
  schema: string;
}

type SubjectsResponse = string[];
type SubjectVersionsResponse = number[];
type DeleteSubjectResponse = number[];
type DeleteSubjectVersionResponse = number;

interface SchemaVersionResponse {
  subject: string;
  id: number;
  version: number;
  schema: string;
}

interface AddSubjectVersionResponse {
  id: number;
}

interface CompatibilityResponse {
  is_compatible: boolean;
}

const apiFetch = async <T>(req: string | Request, init: RequestInit = {}): Promise<T> => {
  const defaultInit = {
    headers: {
      'Content-Type': 'application/vnd.schemaregistry.v1+json',
    },
  };
  const res = await fetch(req, { ...defaultInit, ...init });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    // Generic error to avoid including URL in message, as it may contain
    // sensitive credentials.
    throw TypeError('Schema registry responded with invalid JSON.');
  }
  if (!res.ok) {
    throw new SchemaRegistryError(data.message, data.error_code);
  } else {
    return data;
  }
};

export const getSchema = (baseUrl: string, id: number) => apiFetch<SchemaResponse>(`${baseUrl}/schemas/ids/${id}`);

export const getSubjects = (baseUrl: string) => apiFetch<SubjectsResponse>(`${baseUrl}/subjects`);

export const deleteSubject = (baseUrl: string, subject: string) =>
  apiFetch<DeleteSubjectResponse>(`${baseUrl}/subjects/${subject}`, {
    method: 'DELETE',
  });

export const getSubjectVersions = (baseUrl: string, subject: string) =>
  apiFetch<SubjectVersionsResponse>(`${baseUrl}/subjects/${subject}/versions`);

export const getSubjectVersionSchema = async (baseUrl: string, subject: string, version: number) =>
  apiFetch<Schema>(`${baseUrl}/subjects/${subject}/versions/${version}/schema`);

export const addSubjectVersion = (baseUrl: string, subject: string, schema: Schema) =>
  apiFetch<AddSubjectVersionResponse>(`${baseUrl}/subjects/${subject}/versions`, {
    method: 'POST',
    body: JSON.stringify({ schema: JSON.stringify(schema) }),
  });

export const checkSubjectRegistered = async (baseUrl: string, subject: string, schema: Schema) =>
  apiFetch<SchemaVersionResponse>(`${baseUrl}/subjects/${subject}`, {
    method: 'POST',
    body: JSON.stringify({ schema: JSON.stringify(schema) }),
  });

export const deleteSubjectVersion = (baseUrl: string, subject: string, version: number) =>
  apiFetch<DeleteSubjectVersionResponse>(`${baseUrl}/subjects/${subject}/versions/${version}`, {
    method: 'DELETE',
  });

export const checkCompatibility = async (
  baseUrl: string,
  subject: string,
  version: number | 'latest',
  schema: Schema,
) =>
  apiFetch<CompatibilityResponse>(`${baseUrl}/compatibility/subjects/${subject}/versions/${version}`, {
    method: 'POST',
    body: JSON.stringify({ schema: JSON.stringify(schema) }),
  });

export const idToSchema = async (baseUrl: string, id: number) =>
  JSON.parse((await getSchema(baseUrl, id)).schema) as Schema;

export const schemaToId = async (baseUrl: string, subject: string, schema: Schema) => {
  try {
    return (await checkSubjectRegistered(baseUrl, subject, schema)).id;
  } catch (error) {
    if (error instanceof SchemaRegistryError && (error.code === 40401 || error.code === 40403)) {
      return (await addSubjectVersion(baseUrl, subject, schema)).id;
    } else {
      throw error;
    }
  }
};

export const toSubject = (topic: string) => `${topic}-value`;
