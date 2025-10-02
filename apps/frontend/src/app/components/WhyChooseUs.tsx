// src/app/components/WhyChooseUs.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Truck, DollarSign, Headphones } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-white" />,
      title: "Trusted Quality",
      desc: "We ensure top-quality products that meet international standards.",
    },
    {
      icon: <Truck className="w-10 h-10 text-white" />,
      title: "Fast Delivery",
      desc: "Get your orders delivered quickly and safely to your doorstep.",
    },
    {
      icon: <DollarSign className="w-10 h-10 text-white" />,
      title: "Affordable Prices",
      desc: "Competitive pricing without compromising quality.",
    },
    {
      icon: <Headphones className="w-10 h-10 text-white" />,
      title: "24/7 Support",
      desc: "Our team is always available to help you with any inquiries.",
    },
  ];

  return (
    <section className="w-full py-16 px-6 bg-[#00a2b9] text-white">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
        <p className="text-lg text-white/90">
          We provide outstanding services and products designed with your
          satisfaction in mind.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, idx) => (
          <Card
            key={idx}
            className="bg-white/10 border-none shadow-lg text-center p-6 rounded-2xl hover:bg-white/20 transition"
          >
            <CardContent className="flex flex-col items-center gap-4">
              {feature.icon}
              <h3 className="text-xl font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-white/80">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
