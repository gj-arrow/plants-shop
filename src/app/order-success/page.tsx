'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Заказ оформлен!</h1>
        <p className="text-gray-600 mb-6">
          Спасибо за ваш заказ. Номер заказа: <span className="font-bold">#{orderId}</span>
        </p>
        
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm">
            Мы отправили подтверждение на вашу электронную почту. 
            Наш менеджер свяжется с вами в ближайшее время для уточнения деталей доставки.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition"
        >
          Вернуться в каталог
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
