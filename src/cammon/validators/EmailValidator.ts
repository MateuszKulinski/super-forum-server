export const isEmailValid = (email: string): string => {
    if (!email) return "Adres E-mail nie może być pusty";
    if (!email.includes("@")) return "Proszę podać poprawny adres e-mail";
    if (/\s+/g.test(email))
        return "W adresie e-mail nie można umieszczać znaków odstępu";
    return "";
};
