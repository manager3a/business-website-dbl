# Digital Business Lab (DBL) — Website

Sitio web corporativo de **Digital Business Lab**, Venture Studio con sede en Miami, FL, enfocado en ayudar a emprendedores y empresas en etapa temprana a validar, construir y escalar ideas de negocio con alcance global.

Sitio estático (HTML/CSS/JS vanilla) y arquitectura JAMstack, sin build step, listo para desplegar en Vercel u otro hosting estático directamente desde este repositorio.

## Estado del proyecto

**Fase 1 — Prototipo con branding completo** ✅ (rama `main`)

Prototipo funcional para validación de dirección visual, con la identidad de marca de DBL aplicada al 100%: paleta de colores, tipografía, tono y estructura de navegación completos. El contenido legal (FAQ, Privacidad, Términos, Cookies) aparece como bloques "Coming soon" estilizados, a la espera de la Fase 2.

Próximas fases (pendientes de aprobación del cliente):
- **Fase 2** — Desarrollo completo: contenido legal real, estándares de seguridad (ver método PD01 de Cognit), integración funcional de Calendly y del formulario de contacto (Formspree/EmailJS).
- **Fase 3** — Ajustes finales y entrega.

## Estructura del repositorio

```
/
├── index.html      # Estructura completa del sitio (una sola página con anchors)
├── styles.css      # Design tokens, layout responsivo y componentes
├── script.js       # Menú móvil, scroll-reveal, WhatsApp flotante, formulario
└── README.md
```

## Identidad de marca

| Elemento | Valor |
|---|---|
| Color primario (acento) | `#E1FF3C` — Pantone 389C |
| Color secundario | `#B5D409` — Pantone 382C |
| Fondo | `#000000` (negro moderno) |
| Texto secundario | `#D2D2D2` — Pantone 427C |
| Tipografía principal | Montserrat (headings) |
| Tipografía secundaria | Lato (cuerpo de texto) |
| Logo | Wordmark "DBL" + chevron, en verde lima sobre fondo negro |

Estilo visual: moderno, minimalista, elegante, premium, corporativo, tecnológico.

## Secciones del sitio

- **Navbar** sticky con menú responsive (hamburguesa en mobile)
- **Hero** — propuesta de valor y CTAs principales
- **Focus Areas** — Tecnología, Marketing Digital, Finanzas e Inversión
- **Our Model** — modelo Venture Studio (Validate → Build → Scale)
- **About** — presentación de la empresa
- **Build With Us** — formulario de contacto para que founders compartan su idea/proyecto, más datos de contacto (WhatsApp, dirección)
- **FAQ / Privacidad / Términos / Cookies** — bloques placeholder estilizados
- **Footer** — enlaces, datos de contacto y redes sociales
- **WhatsApp flotante** — enlace directo a `+1 786-940-0991`

## Cómo previsualizar localmente

No requiere instalación de dependencias. Basta con servir los archivos estáticos:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Despliegue

Sitio listo para deploy directo en [Vercel](https://vercel.com) conectando este repositorio de GitHub — no requiere configuración de build (framework: "Other" / archivos estáticos en la raíz).

## Contacto

- **WhatsApp:** +1 786-940-0991
- **Dirección:** 990 Biscayne Blvd, Ste 501-16, Miami, FL, United States
