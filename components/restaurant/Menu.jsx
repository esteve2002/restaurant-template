"use client";

import { motion } from "framer-motion";

export default function Menu({ Entrantes, Principales, Postres, Bebidas }) {
  const categories = [
    { name: "Entrantes", items: Entrantes },
    { name: "Principales", items: Principales },
    { name: "Postres", items: Postres },
    { name: "Bebidas", items: Bebidas },
  ];

  return (
    <section id="menu" className="py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold mb-12 text-center"
      >
        Menú
      </motion.h2>

      <div className="grid md:grid-cols-2 gap-12">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl"
          >
            <h3 className="text-2xl font-semibold mb-6 tracking-wide">
              {cat.name}
            </h3>

            <div className="space-y-6">
              {cat.items?.map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03, x: 6 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex justify-between items-start pb-4 border-b border-white/10"
                >
                  <div>
                    <p className="text-lg font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-lg font-semibold text-yellow-400"
                  >
                    {item.price}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
