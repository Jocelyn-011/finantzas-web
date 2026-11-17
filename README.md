# finANTzas Web

Aplicación web responsive inspirada en la interfaz móvil de Finantzas. Está construida con HTML5, CSS y JavaScript sin framework, y queda preparada para sincronizar movimientos con Supabase.

## Ejecutar localmente

Abre `index.html` directamente o sirve la carpeta con cualquier servidor estático, por ejemplo:

```powershell
python -m http.server 4173
```

Después abre `http://localhost:4173`.

## Conectar Supabase

1. Crea un proyecto en Supabase y ejecuta el contenido de `supabase-schema.sql` en **SQL Editor**.
2. En `supabase-config.js`, asigna la URL del proyecto y su clave anónima pública:

```js
window.FINANTZAS_SUPABASE_URL = "https://tu-proyecto.supabase.co";
window.FINANTZAS_SUPABASE_ANON_KEY = "tu-clave-anon-publica";
```

No incluyas nunca la clave `service_role` en el navegador. El esquema activa RLS para que cada usuario autenticado solo acceda a sus propios movimientos.

## Cuentas bancarias en la web

La sección **Cuentas y conexiones** reemplaza el NFC de la aplicación móvil. En web, una integración real debe usar un proveedor de Open Finance que redirija al banco para el consentimiento del usuario (OAuth), con los secretos y tokens guardados en una función de servidor. Esta versión no solicita ni simula claves bancarias: permite probar la experiencia con datos locales y deja `bank_accounts` preparado en Supabase.

## Subir a GitHub

Este directorio todavía no tiene un remoto. Crea primero un repositorio vacío en GitHub y luego, desde esta carpeta, ejecuta:

```powershell
git add .
git commit -m "feat: panel web de Finantzas"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

También puedes enviarme la URL del repositorio vacío y podré dejar el remoto configurado; no compartas tokens ni contraseñas.

## Características

- Tablero de presupuesto, categorías, alertas de gasto hormiga y simulador de ahorro.
- Registro y filtrado de transacciones con persistencia local inmediata.
- Panel de cuentas bancarias orientado a Open Finance, con conexión de demostración.
- Analítica de proyección, flujo de dinero y límites editables por categoría.
- Ajustes de perfil y tema claro/oscuro.
