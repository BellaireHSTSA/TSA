import { z } from "zod";
import {
  insertOfficerSchema,
  insertEventSchema,
  insertChampionSchema,
  type Officer,
  type Event,
  type Champion,
} from "./schema";

export const errorSchemas = {
  notFound: z.object({ message: z.string() }),
};

export const api = {
  officers: {
    list: {
      method: "GET" as const,
      path: "/api/officers" as const,
      responses: {
        200: z.array(z.custom<Officer>()),
      },
    },
  },
  events: {
    list: {
      method: "GET" as const,
      path: "/api/events" as const,
      responses: {
        200: z.array(z.custom<Event>()),
      },
    },
  },
  champions: {
    list: {
      method: "GET" as const,
      path: "/api/champions" as const,
      responses: {
        200: z.array(z.custom<Champion>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/champions" as const,
      body: insertChampionSchema,
      responses: {
        201: z.custom<Champion>(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/champions/:id" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
