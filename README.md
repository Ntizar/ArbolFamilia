# ÁrbolFamilia

Crea, descarga y vuelve a cargar árboles genealógicos desde el navegador. Sin cuentas, sin servidor: el árbol se guarda solo en tu navegador y, si quieres, en un fichero.

**Web:** https://ntizar.github.io/ArbolFamilia/

## Cómo se usa

1. **Añadir persona**: nombre y, si quieres, año de nacimiento y de fallecimiento.
2. **Unir en pareja**: elige dos personas y, si quieres, el año de la boda. Segundas bodas: crea otra unión con la misma persona.
3. **Hijos**: al añadir una persona, elige «Hijo/a de» una pareja o de una persona suelta.
4. El árbol **se dibuja y reordena solo** con cada cambio y se guarda solo en el navegador.
5. **Descargar** guarda un fichero `arbol-familia.json`; **Cargar fichero** lo recupera en otro móvil u ordenador.

## Tecnología

- HTML estático puro (GitHub Pages), sin backend.
- UI con [Aurora](https://github.com/Ntizar/Aurora) (canal `@v10.10.0`, marca monocromo).
- Dibujo del árbol: Mermaid 12.1 renderizado a SVG con [pele](https://github.com/obsidianmd/pele), vestido con el skin [PeleAurora](https://github.com/Ntizar/PeleAurora).
- Autosave en `localStorage` + descarga/carga JSON.

Hecho con ❤️ por David Antizar
