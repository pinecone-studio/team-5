"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { SetContextLink } from "@apollo/client/link/context";
import { ClerkProvider, useAuth } from "@clerk/react";
import MissingConfigState from "@/components/missing-config-state";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;

function AuthenticatedApolloProvider({
  children,
  graphqlUrl,
}: {
  children: ReactNode;
  graphqlUrl: string;
}) {
  const { getToken } = useAuth();
  const clientRef = useRef<ApolloClient | null>(null);
  const getTokenRef = useRef(getToken);
  const [client, setClient] = useState<ApolloClient | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (clientRef.current == null) {
      const authLink = new SetContextLink(async (prevContext) => {
        const token = await getTokenRef.current();

        return {
          headers: {
            ...prevContext.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };
      });

      const httpLink = new HttpLink({
        uri: graphqlUrl,
        credentials: "include",
      });

      clientRef.current = new ApolloClient({
        cache: new InMemoryCache(),
        link: ApolloLink.from([authLink, httpLink]),
      });
      setClient(clientRef.current);
    }
  }, [graphqlUrl]);

  return client ? (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  ) : null;
}

export function ClerkAppProvider({ children }: { children: ReactNode }) {
  if (!clerkPublishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} signInUrl="/login">
      {children}
    </ClerkProvider>
  );
}

export default function AppApolloProvider({
  children,
}: {
  children: ReactNode;
}) {
  if (!clerkPublishableKey || !graphqlUrl) {
    const missingKeys = [
      clerkPublishableKey ? null : "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      graphqlUrl ? null : "NEXT_PUBLIC_GRAPHQL_URL",
    ].filter((value): value is string => value != null);

    return (
      <MissingConfigState
        missingKeys={missingKeys}
        description="Хамгаалалттай хуудсуудыг ашиглахын тулд auth болон GraphQL тохиргоо шаардлагатай."
      />
    );
  }

  return (
    <AuthenticatedApolloProvider graphqlUrl={graphqlUrl}>
      {children}
    </AuthenticatedApolloProvider>
  );
}
