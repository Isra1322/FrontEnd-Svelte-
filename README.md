# NorthWind Sales - Frontend en Svelte 5

Aplicación web cliente moderna desarrollada con **Svelte 5** y **Vite**, migrada desde Blazor WebAssembly. Proporciona una interfaz ágil, reactiva y desacoplada para la gestión comercial y facturación de NorthWind Sales, consumiendo una Web API REST alojada en Linux Debian.

---

## 🚀 Pila Tecnológica (Stack)

- **Framework:** Svelte 5 (sintaxis de componentes nativos, runes y montaje con `mount()`).
- **Empaquetador y Servidor Local:** Vite.
- **Estilos:** Bootstrap 5 y CSS personalizado corporativo (`#0d3b66`).
- **Cliente HTTP:** Axios (con interceptores para JWT).
- **Gestión de Estado:** Svelte Stores reactivos (`$auth`, `$order`, `$navigation`).

---

## 🏛️ Arquitectura y Conexión al Backend

- **Host de la API:** Debian Linux (entorno local o accesible mediante VPN/Tailscale).
- **Cliente Axios centralizado (`src/services/api.js`):**
  - `baseURL` parametrizable (ej. `http://100.126.173.43:5000` o IP local).
  - Interceptor global que inyecta automáticamente el encabezado `Authorization: Bearer <accessToken>` extraído de `localStorage`.
- **Seguridad y Persistencia (`src/stores/auth.js`):**
  - Almacenamiento seguro del token JWT.
  - Al ejecutar `logout`, limpia la sesión y restablece el estado temporal de órdenes y clientes en memoria para evitar residuos.

---

## 📋 Módulos y Reglas de Negocio Implementadas

### 🔐 Autenticación (Login & Registro)
- Inputs con límites estrictos de 30 caracteres.
- **Nombre y Apellido:** solo caracteres alfabéticos, sin espacios ni caracteres especiales, con autoformateo a *Title Case*.
- **Correo electrónico:** sanitización en tiempo real, bloqueo de guiones consecutivos (`--`) y restricción de puntos posdominio.

### 🛒 Crear Orden de Venta
- **Formulario simétrico en 2 columnas:** Datos del Cliente (solo lectura) y Datos de Entrega.
- **Validación de entrega:**
  - Dirección: máx. 40 caracteres (solo letras, números, puntos y guiones simples).
  - Ciudad y País: máx. 20 caracteres (solo letras).
  - Código Postal: numérico de 6 dígitos.
- **Bloqueo inmediato por Deuda:** Si el cliente posee deuda pendiente (> $0), se despliega alerta roja y se inhabilita el flujo de pedido.
- **Botón "+ Agregar producto":** habilitado únicamente con cliente seleccionado sin deuda y código postal de 6 dígitos.
- **Carrito y Productos:**
  - Los productos agregados muestran estado *"Ya seleccionado"* en el modal de búsqueda.
  - El campo cantidad bloquea ceros a la izquierda y valores `<= 0` (mínimo 1).
  - Eliminación con modal de confirmación y fondo difuminado (*backdrop blur*).
- **Finalización:** Envío a la API con visualización inmediata del comprobante PDF.

### 📄 Consultar Facturas
- Tabla con paginación de 8 registros por página sin desbordamiento vertical.
- **Filtros específicos:**
  - **No. Factura:** máx. 10 números.
  - **Cliente:** máx. 10 letras.
  - **Fecha:** con máscara `DD/MM/YYYY`, validación de rangos `01-31`, `01-12`, `1901-2999` y bloqueo de fechas futuras.
- Modal visor integrado para visualizar y descargar el PDF de la factura.

---

## 🛠️ Guía de Instalación y Ejecución

### Requisitos previos
- Node.js (versión 18 o superior).
- Backend NorthWind Web API en ejecución.

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Isra1322/FrontEnd-Svelte-.git
cd FrontEnd-Svelte-

# 2. Instalar dependencias
npm install

# 3. Configurar endpoint del backend en src/services/api.js
# Ajustar la IP según la máquina Debian / Tailscale:
# baseURL: 'http://<IP_DEBIAN>:5000'

# 4. Iniciar en entorno de desarrollo
npm run dev
# (En Windows PowerShell si hay bloqueo de scripts: npm.cmd run dev)
```
