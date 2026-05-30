# Mi Gallinero 🐔

PWA para gestión de gallinero de ponedoras Lohmann Brown.

## Stack
- React + Vite · Tailwind CSS · Firebase (Auth + Firestore)

---

## 1. Crear el proyecto en Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. **Crear proyecto** → nombre: `mi-gallinero` → continuar hasta finalizar
3. En el menú lateral: **Authentication** → Comenzar → habilitar proveedor **Correo/Contraseña**
4. En el menú lateral: **Firestore Database** → Crear base de datos → **Modo producción** → elige región (p. ej. `us-central`)

---

## 2. Obtener las credenciales

1. En Firebase Console → ⚙️ Configuración del proyecto → **Tus apps**
2. Clic en `</>` (Web) → nombre: `gallinero-web` → registrar app
3. Copia el objeto `firebaseConfig` — necesitas esos 6 valores

---

## 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con los valores reales:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 4. Reglas de Firestore (seguridad)

En Firebase Console → Firestore → **Reglas**, reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sólo usuarios autenticados y activos
    function isAuth() {
      return request.auth != null;
    }
    function isAdmin() {
      return isAuth() &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }
    function isActive() {
      return isAuth() &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.activo == true;
    }

    // Perfil de usuario — lectura propia, escritura propia (creación)
    match /usuarios/{uid} {
      allow read:   if isAuth();
      allow create: if request.auth.uid == uid;
      allow update: if isAdmin();
    }

    // Config — sólo admin escribe
    match /config/{doc} {
      allow read:  if isActive();
      allow write: if isAdmin();
    }

    // Datos operativos — lectura y creación para activos, borrado solo admin
    match /{collection}/{docId} {
      allow read:   if isActive();
      allow create: if isActive();
      allow update: if isActive();
      allow delete: if isAdmin();
    }
  }
}
```

---

## 5. Crear usuarios

Los usuarios **solo se crean desde Firebase Console** (no hay registro público):

1. Firebase Console → **Authentication** → **Usuarios** → **Agregar usuario**
2. Ingresa correo y contraseña para Miguel y para Mamá
3. Al hacer el primer login, la app crea automáticamente el perfil en Firestore
4. El **primer usuario** que inicia sesión recibe rol `admin`; los siguientes reciben `colaborador`
5. El admin puede cambiar roles desde **Configuración → Usuarios registrados**

---

## 6. Instalar y correr

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # build de producción en /dist
```

---

## 7. Deploy en Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

O arrastra la carpeta `dist` a [app.netlify.com/drop](https://app.netlify.com/drop).

---

## Roles

| Acción                    | Admin | Colaborador |
|---------------------------|-------|-------------|
| Registrar producción      | ✓     | ✓           |
| Registrar ventas          | ✓     | ✓           |
| Registrar alimentación    | ✓     | ✓           |
| Registrar sanidad         | ✓     | ✓           |
| **Eliminar registros**    | ✓     | ✗           |
| **Configuración**         | ✓     | ✗           |
| **Gestionar usuarios**    | ✓     | ✗           |

---

## Logo

Reemplaza `src/assets/logo.png` con tu logotipo real (preferentemente cuadrado, mínimo 180×180 px).
