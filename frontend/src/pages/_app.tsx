import type { AppProps } from "next/app";
import AuthProvider from "../providers/authprovider";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
