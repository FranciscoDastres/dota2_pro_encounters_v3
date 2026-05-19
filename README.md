# Pro Encounters 🎮

Una aplicación moderna y elegante para descubrir con qué jugadores profesionales de Dota 2 te has enfrentado. Construida con React, Tailwind CSS, Axios y Context API.

![Dota 2](https://img.shields.io/badge/Dota%202-Pro%20Finder-red?logo=steam&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-3.4-38b2ac?logo=tailwindcss&logoColor=white)

## 🎯 Características

- ✨ **Interfaz elegante y moderna** - Dark mode premium con animaciones suaves
- 🎨 **Diseño responsivo** - Funciona perfectamente en desktop, tablet y mobile
- ⚡ **Rendimiento optimizado** - Componentes modularizados y lazy loading
- 🔄 **Manejo de estado profesional** - Context API centralizado
- 📡 **API robusta** - Axios con interceptores y manejo de errores
- 🎭 **Animaciones fluidas** - Framer Motion para transiciones elegantes
- ♿ **Accesibilidad** - Totalmente accesible y WCAG compliant
- 🌐 **Variables de entorno** - Configuración flexible por ambiente

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Backend API en `http://localhost:4000`

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd dota2-pro-encounters

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# (Opcional) Configurar API URL en .env.local
# VITE_API_URL=http://localhost:4000
```

## 🔧 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor estará disponible en http://localhost:5173
```

## 📦 Estructura del Proyecto

```
src/
├── components/              # Componentes React reutilizables
│   ├── SearchBar/          # Barra de búsqueda principal
│   ├── ProPlayersList/     # Grid de jugadores profesionales
│   ├── LoadingState/       # Componente de carga
│   ├── ErrorState/         # Notificación de errores
│   └── SuccessState/       # Notificación de éxito
├── context/
│   └── AppContext.jsx      # Context API global
├── hooks/
│   └── useSteamAPI.js      # Custom hook para API Steam
├── services/
│   └── api.js              # Configuración de Axios
├── App.jsx                 # Componente principal
├── main.jsx                # Punto de entrada
├── index.css               # Estilos globales
└── App.css                 # Estilos específicos (si aplica)
```

## 🎨 Paleta de Colores (Dota 2 Inspired)

| Color | Hex | Variable |
|-------|-----|----------|
| Radiant | #92a825 | `dota-accent` |
| Dire | #c23c2a | `dota-red` |
| Dark | #0a0e27 | `dota-dark` |
| Blue | #217dbb | `dota-blue` |
| Gold | #d4a574 | `dota-gold` |

## 📡 API Endpoints

### Buscar Jugadores Profesionales

```
POST /api/run-script
Content-Type: application/json

{
  "accountId": "123456789"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "account_id": "123456789",
      "rank": "Divine",
      "mmr": 9500,
      "matches_count": 45
    }
  ]
}
```

## 🔐 Manejo de Errores

La aplicación cuenta con manejo robusto de errores:

- Validación de entrada (solo números, longitud máxima)
- Errores de conexión
- Timeouts
- Errores de servidor (4xx, 5xx)
- Mensajes de error amigables para el usuario

## 🎬 Animaciones

Todas las animaciones están basadas en Framer Motion:

- `fade-in-up` - Aparición con movimiento hacia arriba
- `slide-in-left` - Deslizamiento desde la izquierda
- `glow` - Efecto de brillo (neon)
- `pulse-slow` - Pulso lento
- `animate-pulse` - Pulso de Tailwind

## 🔄 Context API

El estado global se maneja con Context:

```javascript
const {
  accountId,           // ID de cuenta actual
  setAccountId,        // Setter del ID
  playerData,          // Datos de jugadores
  setPlayerData,       // Setter de datos
  error,               // Mensaje de error
  setError,            // Setter de error
  isLoading,           // Estado de carga
  setIsLoading,        // Setter de carga
  success,             // Estado de éxito
  setSuccess,          // Setter de éxito
  clearError,          // Limpia el error
  clearSuccess,        // Limpia el éxito
  resetState,          // Resetea todo
} = useContext(AppContext);
```

## 🪝 Custom Hooks

### useSteamAPI

```javascript
const { accountId, setAccountId, fetchData } = useSteamAPI();

// Usar en componentes
const handleSearch = async () => {
  await fetchData();
};
```

## 🧪 Validación

La validación se realiza en:

1. **Frontend** - Validación inmediata del ID
2. **Services** - Validación antes de enviar (números, longitud)
3. **Backend** - Validación server-side

## 📊 Rendimiento

- **Code Splitting** - Carga de componentes optimizada
- **Lazy Loading** - Imágenes y componentes pesados
- **Memoization** - Prevención de re-renders innecesarios
- **Debouncing** - En búsquedas (implementable)

## 🌍 Deployment

### Vercel

```bash
npm run build
# Deployar carpeta 'dist' a Vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

## 📝 Variables de Entorno

```env
# Desarrollo
VITE_API_URL=http://localhost:4000

# Producción
VITE_API_URL=https://api.example.com
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado para la comunidad de Dota 2

## 🐛 Reportar Bugs

Abre un issue con:
- Descripción detallada
- Pasos para reproducir
- Screenshots/videos si es aplicable
- Tu navegador y versión

## 🎓 Recursos

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Axios](https://axios-http.com)
- [Dota 2 API](https://www.opendota.com)

---

**Última actualización:** Febrero 2026 ✨# dota2_pro_encounters_v3
