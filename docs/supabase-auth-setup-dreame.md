# DREAMÈ Beauty Cosmetics — konfigurimi i hyrjes

Ky projekt përdor **Supabase Authentication**. Ndryshimet në GitHub shtojnë butonin
"Vazhdo me Google" dhe mbajnë regjistrimin me email si alternativë.
**Kodi në frontend nuk aktivizon vetë Google OAuth dhe nuk konfiguron server SMTP.**
Këto bëhen në panelin Supabase të projektit aktual. Mos shkruani asnjë sekret në GitHub.

## 1. Google (një herë në panel)

1. Në Google Cloud Console, krijoni/zgjedhni një projekt dhe konfiguroni OAuth consent screen.
2. Krijoni OAuth Client ID për Web application.
3. Te Authorized redirect URI vendosni **Supabase Auth callback URL**
   të dhënë në Supabase → Authentication → Sign In / Providers → Google.
   (Është URL-ja e Supabase, jo thjesht `/account` e website-it.)
4. Vendosni Client ID / Client Secret te Supabase → Authentication → Providers → Google.
5. Aktivizoni provider Google dhe ruajeni.
6. Te Supabase → Authentication → URL Configuration, siguroni:
   Site URL: `https://dreamebeautycosmetics.com`
   Allowed Redirect URL: `https://dreamebeautycosmetics.com/account`
7. Provoni një llogari normale Google. Mos jepni rol admin automatikisht.

Udhëzimi zyrtar: https://supabase.com/docs/guides/auth/social-sign-in/auth-google

## 2. Dërgimi i emailit të konfirmimit me emrin DREAMÈ

Supabase SMTP i parazgjedhur nuk është për website publik: dërgon vetëm
te adresat e autorizuara të ekipit dhe ka kufizime të rrepta.

1. Konfiguroni një adresë dërgimi të vërtetuar për `dreamebeautycosmetics.com`
   (p.sh. `info@dreamebeautycosmetics.com`, vetëm nëse ekziston e funksionon).
2. Merrni host, port, user dhe fjalëkalim SMTP nga shërbimi i emailit
   (te cPanel → Email Accounts → Connect Devices, nëse përdorni emailin e cPanel).
3. Te Supabase → Authentication → SMTP Settings, aktivizoni Custom SMTP.
   Vendosni sender name `DREAMÈ Beauty Cosmetics`, sender email dhe të dhënat SMTP.
   Fjalëkalimi futet **vetëm në Supabase**, asnjëherë në mesazh ose në kod.
4. Verifikoni DNS SPF / DKIM / DMARC për domenin e dërgimit.
5. Te Supabase → Authentication → Email Templates → Confirm sign up vendosni:
   Subject: `Konfirmo llogarinë — DREAMÈ Beauty Cosmetics`
   HTML: përmbajtjen e `docs/supabase-confirm-signup-dreame.html`.
   Mos e hiqni shprehjen `{{ .ConfirmationURL }}`.
6. Te Supabase → Authentication → Providers → Email, mbani aktiv
   **Confirm email** për regjistrimet me fjalëkalim.
7. Provoni email të ri, shihni Inbox/Spam dhe Auth logs nëse nuk mbërrin.

Udhëzime zyrtare:
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/redirect-urls

## Sjellja e regjistrimit

- Me Google: identiteti verifikohet nga Google; për login normal zakonisht
  nuk nevojitet email konfirmimi i ndarë nga website-i.
- Me email + fjalëkalim: Supabase dërgon emailin e konfirmimit sipas template
  dhe SMTP të konfiguruar. Nuk premtohet dërgimi pa SMTP funksional.
- Hyrja me Google nuk e jep rolin admin. Rolet mbeten të menaxhuara veçmas.

## Publikimi

Ndryshimet në GitHub deployohen në staging në branch `cpanel-deploy`.
Asgjë nuk publikohet në cPanel pa kontroll dhe komandën e publikimit.
