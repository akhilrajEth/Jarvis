import type { AppProps } from "next/app";
import AuthProvider from "../providers/authprovider";
import Navbar from "../components/navbar";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
