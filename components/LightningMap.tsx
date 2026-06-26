"use client";
import dynamic from "next/dynamic";
const LightningMapInner = dynamic(() => import("./LightningMapInner"), { ssr: false });
export default function LightningMap() {
  return <LightningMapInner />;
}
