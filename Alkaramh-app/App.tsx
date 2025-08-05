
import firebase from "@react-native-firebase/app";
import { I18nextProvider } from "react-i18next";
import { StatusBar } from "react-native";
import Toast from "react-native-toast-message";
import { AuthProvider } from "./context/AuthContext";
import i18n from "./i18n";
import InitialRouter from "./Router/InitialRouter";
export default function App() {

console.log("Firebase initialized:", firebase.app().name);
  return (
    <I18nextProvider i18n={i18n}>
    <AuthProvider>
      <InitialRouter />
      <StatusBar barStyle="default" />
      <Toast/>
    </AuthProvider>
    </I18nextProvider>
  );
}
