# 🤝 Guía de Contribución para Linux-Market POS
**Ayúdanos a mejorar el ecosistema comercial más moderno de Linux.**

¡Gracias por tu interés en colaborar! Linux-Market POS es un proyecto de código abierto y agradecemos cualquier tipo de contribución: corrección de errores, nuevas funcionalidades, traducciones o mejoras de documentación.

---

## 🚀 Proceso de Trabajo

Para asegurar un código estable y una colaboración fluida, sigue estos pasos:

1.  **Explora los Issues**: Antes de empezar, verifica si alguien ya está trabajando en lo mismo o abre un Issue para discutir una nueva funcionalidad.
2.  **Haz un Fork**: Crea tu propia copia del repositorio en GitHub.
3.  **Clona tu Fork localmente**:
    ```bash
    git clone https://github.com/TU_USUARIO/linux-market.git
    cd linux-market
    ```
4.  **Crea una Rama**: Dale un nombre descriptivo a tu rama:
    ```bash
    git checkout -b feature/nueva-mejoras-inventario
    # o para correcciones
    git checkout -b fix/error-impresora-terminal
    ```
5.  **Desarrollo y Commits**: Realiza tus cambios y haz commits claros y descriptivos.
    ```bash
    git commit -m "feat: implementar filtro por sucursal en reportes"
    ```
6.  **Sincronización**: Mantén tu rama actualizada con la rama `main` original.
7.  **Sube tus cambios y abre un Pull Request**: Una vez listo, sube tu rama y abre el PR en GitHub detallando los cambios realizados.

---

## 🎨 Estándares de Código

*   **TypeScript**: Todo el frontend debe estar tipado estrictamente.
*   **Next.js**: Sigue el patrón de App Router (Next.js 16+).
*   **Estilos**: Usa exclusivamente **Tailwind CSS v4** y sigue la estética "Cyber-Dark".
*   **Consistencia**: Mantén el formato de archivos `.tsx`, `.ts` y `.rs`.
*   **Comentarios**: Documenta funciones complejas y evita comentarios redundantes.

---

## 📁 Áreas Prioritarias

1.  **Periféricos Industriales**: Soporte para más modelos de impresoras térmicas y balanzas.
2.  **Sincronización Cloud**: Capa de sincronización con PostgreSQL/Supabase.
3.  **Localización**: Traducciones completas a Inglés, Portugués y Francés.
4.  **UI/UX**: Mejoras en la accesibilidad del Punto de Venta (POS).
5.  **Seguridad**: Auditorías de código y mejoras en la gestión de sesiones.

---

## 🛡️ Reporte de Errores

Si encuentras un error, por favor abre un Issue incluyendo:
- Una descripción clara del problema.
- Pasos para reproducirlo.
- Entorno (SO, versión de Node/Rust).
- Capturas de pantalla o logs si es posible.

---

¡Gracias por ser parte de **Linux-Market POS** y apoyar el software libre!  
Desarrollado con pasión por **Alexis Gabriel Lugo Villeda**.
