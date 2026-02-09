import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PRODUCTS from "./data/products.json";

const LS_CART = "mb_cart_v1";
const LS_ORDERS = "mb_orders_v1";

export default function App() {
  const [currentSection, setCurrentSection] = useState("home");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, title: "", message: "" });
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "Contraentrega",
  });

  // Load saved data
  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem(LS_CART) || "[]");
      const savedOrders = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
      if (Array.isArray(savedCart)) setCart(savedCart);
      if (Array.isArray(savedOrders)) setOrders(savedOrders);
    } catch {
      // ignore
    }
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(LS_CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
  }, [orders]);

  const showSection = (section) => {
    setCurrentSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showToast = (title, message) => {
    setToast({ show: true, title, message });
    window.clearTimeout(window.__mb_toast_timer);
    window.__mb_toast_timer = window.setTimeout(
      () => setToast({ show: false, title: "", message: "" }),
      2500
    );
  };

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const delivery = subtotal >= 35 || subtotal === 0 ? 0 : 6;
    const total = subtotal + delivery;

    return { subtotal, delivery, total };
  }, [cart]);

  const addToCart = (productId, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === productId);

      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(item.quantity + quantity, 99) }
            : item
        );
      }

      return [...prevCart, { productId, quantity: Math.min(quantity, 99) }];
    });

    showToast("Agregado", "Producto añadido al carrito");
  };

  const updateCartItem = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(Math.max(newQuantity, 1), 99) }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
    showToast("Quitado", "Producto eliminado del carrito");
  };

  const clearCart = () => {
    setCart([]);
    showToast("Listo", "Carrito vaciado");
  };

  const placeOrder = () => {
    if (!formData.name || !formData.phone || !formData.address) {
      showToast("Falta información", "Completa nombre, teléfono y dirección");
      return;
    }

    if (cart.length === 0) {
      showToast("Carrito vacío", "Agrega productos antes de finalizar");
      return;
    }

    const newOrder = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: "Recibido",
      paymentMethod: formData.paymentMethod,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerAddress: formData.address,
      items: [...cart],
      subtotal: cartSummary.subtotal,
      delivery: cartSummary.delivery,
      total: cartSummary.total,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setFormData({ name: "", phone: "", address: "", paymentMethod: "Contraentrega" });
    setIsModalOpen(false);
    showToast("Pedido creado", `Tu pedido #${newOrder.id} fue registrado`);
    showSection("orders");
  };

  const clearOrders = () => {
    setOrders([]);
    showToast("Listo", "Historial eliminado");
  };

  const getStatusEmoji = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("camino")) return "🚚";
    if (s.includes("entreg")) return "✅";
    if (s.includes("cancel")) return "⛔";
    return "🧾";
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory = currentCategory === "Todos" || product.category === currentCategory;
      const matchesSearch =
        !searchQuery ||
        `${product.name} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [currentCategory, searchQuery]);

  const categories = useMemo(() => {
    return ["Todos", ...Array.from(new Set(PRODUCTS.map((p) => p.category))).sort()];
  }, []);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const orderCount = orders.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50/20">
      {/* Toast notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4"
          >
            <div className="font-bold text-slate-800">{toast.title}</div>
            <div className="text-slate-600 text-sm mt-1">{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-white/80 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center font-bold text-white text-lg shadow-md">
              MB
            </div>
            <div>
              <div className="font-bold text-xl tracking-tight text-slate-800">MarketBarrio</div>
              <div className="text-xs text-slate-500">Tu bodega online</div>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            {["home", "cart", "orders"].map((section) => (
              <button
                key={section}
                onClick={() => showSection(section)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-medium transition-all ${
                  currentSection === section
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {section === "home" && <span>🏠</span>}
                {section === "cart" && <span>🛒</span>}
                {section === "orders" && <span>📦</span>}
                <span className="capitalize">{section === "home" ? "Inicio" : section}</span>
                {(section === "cart" || section === "orders") && (
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      section === "cart"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {section === "cart" ? cartItemCount : orderCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero Section */}
        {currentSection === "home" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left column */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                    Compra rápido, recibe en tu puerta
                  </h1>
                  <p className="text-slate-600 mt-2">
                    Elige productos, arma tu carrito y finaliza tu pedido.
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    Pago: contraentrega (demo)
                  </p>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        🔍
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setCurrentCategory(category)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            currentCategory === category
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 text-sm text-slate-500">
                      {filteredProducts.length}{" "}
                      {filteredProducts.length === 1 ? "producto" : "productos"} disponibles
                      {currentCategory !== "Todos" && ` • Categoría: ${currentCategory}`}
                      {searchQuery && ` • Búsqueda: "${searchQuery}"`}
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Productos</h2>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <span>↑</span>
                      <span>Subir</span>
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <h3 className="font-bold text-slate-800">No hay resultados</h3>
                      <p className="text-slate-600 mt-2">Prueba con otra búsqueda o categoría</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredProducts.map((product) => {
                        const cartItem = cart.find((item) => item.productId === product.id);
                        const quantity = cartItem ? cartItem.quantity : 1;

                        return (
                          <motion.div
                            key={product.id}
                            whileHover={{ y: -4 }}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                          >
                            <div className="p-4">
                              <div className="flex space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                                  {product.emoji}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-slate-800">{product.name}</h3>
                                  <p className="text-slate-600 text-sm mt-1">{product.description}</p>
                                </div>
                              </div>

                              {/* ✅ ARREGLO: Controles responsive para que NO se corte “Agregar” */}
                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="font-bold text-lg text-blue-600">
                                    S/ {Number(product.price).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {product.category} • {product.unit}
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden w-fit">
                                    <button
                                      onClick={() => updateCartItem(product.id, quantity - 1)}
                                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                                    >
                                      −
                                    </button>
                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                    <button
                                      onClick={() => updateCartItem(product.id, quantity + 1)}
                                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => addToCart(product.id, quantity)}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl transition-colors shadow-sm hover:shadow text-sm"
                                  >
                                    Agregar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Resumen
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500">Productos en catálogo</div>
                      <div className="text-2xl font-bold text-slate-800">{PRODUCTS.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Productos en carrito</div>
                      <div className="text-2xl font-bold text-slate-800">{cartItemCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Pedidos realizados</div>
                      <div className="text-2xl font-bold text-slate-800">{orderCount}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Carrito
                  </div>
                  {cart.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">🧺</div>
                      <div className="font-medium text-slate-700">Tu carrito está vacío</div>
                      <button
                        onClick={() => showSection("home")}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Ir a productos
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {cart.map((item) => {
                        const product = PRODUCTS.find((p) => p.id === item.productId);
                        if (!product) return null;

                        return (
                          <div
                            key={item.productId}
                            className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0"
                          >
                            <div>
                              <div className="font-medium text-slate-800">{product.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {item.quantity} × S/ {Number(product.price).toFixed(2)}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-slate-400 hover:text-red-500 text-sm"
                            >
                              Quitar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Subtotal</span>
                        <span className="font-medium">S/ {cartSummary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Delivery</span>
                        <span className="font-medium">
                          {cartSummary.delivery === 0
                            ? "Gratis"
                            : `S/ ${cartSummary.delivery.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-slate-100">
                        <span>Total</span>
                        <span>S/ {cartSummary.total.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
                      >
                        Finalizar pedido
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Cart Section */}
        {currentSection === "cart" && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Carrito</h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 font-medium flex items-center space-x-1"
                >
                  <span>Vaciar</span>
                  <span>🧺</span>
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4">🧺</div>
                <h3 className="text-xl font-bold text-slate-800">Tu carrito está vacío</h3>
                <p className="text-slate-600 mt-2">Ve a Inicio y agrega productos</p>
                <button
                  onClick={() => showSection("home")}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors"
                >
                  Ir a productos
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 p-5">
                <div className="md:col-span-2 space-y-4">
                  {cart.map((item) => {
                    const product = PRODUCTS.find((p) => p.id === item.productId);
                    if (!product) return null;

                    return (
                      <div key={item.productId} className="flex space-x-4 p-4 bg-slate-50 rounded-xl">
                        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                          {product.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">{product.name}</div>
                          <div className="text-slate-600 text-sm mt-1">{product.description}</div>
                          <div className="text-xs text-slate-500 mt-1">{product.category}</div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <div className="font-bold text-lg text-blue-600">
                            S/ {(Number(product.price) * item.quantity).toFixed(2)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Resumen</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-slate-700">
                        <span>Subtotal</span>
                        <span className="font-medium">S/ {cartSummary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Delivery</span>
                        <span className="font-medium">
                          {cartSummary.delivery === 0
                            ? "Gratis"
                            : `S/ ${cartSummary.delivery.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between font-bold text-xl text-slate-800">
                        <span>Total</span>
                        <span>S/ {cartSummary.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-md hover:shadow-lg"
                  >
                    Finalizar pedido
                  </button>

                  <div className="text-xs text-slate-500 text-center p-4 bg-blue-50 rounded-xl">
                    <div className="font-medium mb-1">Demo para GitHub Pages</div>
                    <p>Carrito y pedidos se guardan en tu navegador (localStorage).</p>
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Orders Section */}
        {currentSection === "orders" && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Mis pedidos</h2>
              {orders.length > 0 && (
                <button
                  onClick={clearOrders}
                  className="text-red-500 hover:text-red-700 font-medium flex items-center space-x-1"
                >
                  <span>Borrar historial</span>
                  <span>📭</span>
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-slate-800">Aún no tienes pedidos</h3>
                <p className="text-slate-600 mt-2">Cuando finalices una compra, aparecerá aquí</p>
                <button
                  onClick={() => showSection("home")}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors"
                >
                  Comprar ahora
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const date = new Date(order.createdAt);
                  const formattedDate = isNaN(date.getTime())
                    ? order.createdAt
                    : date.toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                  return (
                    <div key={order.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-slate-800">Pedido #{order.id}</div>
                          <div className="text-sm text-slate-500 mt-1">
                            {formattedDate} • {order.paymentMethod}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                          <span>{getStatusEmoji(order.status)}</span>
                          <span>{order.status}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 pl-2 border-l-2 border-slate-200 ml-2">
                        {order.items.map((item, index) => {
                          const product = PRODUCTS.find((p) => p.id === item.productId);
                          return (
                            <div key={index} className="text-slate-700">
                              • {item.quantity} ×{" "}
                              {product ? product.name : `Producto #${item.productId}`}
                            </div>
                          );
                        })}
                        <div className="text-xs text-slate-500 mt-2">
                          Entrega: {order.customerAddress}
                        </div>
                      </div>

                      <div className="flex justify-between font-bold text-lg text-slate-800 pt-3 border-t border-slate-100">
                        <span>Total</span>
                        <span>S/ {Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}
      </main>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.98, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 10, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Finalizar pedido</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Tu teléfono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Dirección de entrega
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Tu dirección completa"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Método de pago
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    >
                      <option>Contraentrega</option>
                      <option>Yape/Plin (simulado)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm font-medium text-slate-700 mb-2">
                    Resumen del pedido
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal</span>
                    <span className="font-medium">S/ {cartSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Delivery</span>
                    <span className="font-medium">
                      {cartSummary.delivery === 0
                        ? "Gratis"
                        : `S/ ${cartSummary.delivery.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 my-3"></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>S/ {cartSummary.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={placeOrder}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
                  >
                    Confirmar pedido
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-8 mt-12 border-t border-slate-200 bg-white/80">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-600 text-sm">
          <div className="font-medium mb-1">MarketBarrio — React + Tailwind + Framer Motion</div>
          <div>Demo para GitHub Pages • 2026</div>
        </div>
      </footer>
    </div>
  );
}
