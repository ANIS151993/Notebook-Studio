# DataMentor Research Documents (Encrypted)

This folder intentionally stores the research package in encrypted form.

Encrypted file:
- `datamentor_research_bundle.tar.gz.enc`

After authorized access, decrypt with OpenSSL:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -in datamentor_research_bundle.tar.gz.enc \
  -out datamentor_research_bundle.tar.gz
```

Then extract:

```bash
tar -xzf datamentor_research_bundle.tar.gz
```

Use the password provided by Md Anisur Rahman Chowdhury.
