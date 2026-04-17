<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * POST /api/orders
     * Creates one order per business group with its items.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_id'     => 'required|integer|exists:businesses,id',
            'payment_method'  => 'required|string|max:50',
            'delivery_method' => 'required|string|in:pickup,delivery',
            'notes'           => 'nullable|string|max:500',
            'items'           => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            $total = collect($validated['items'])
                ->sum(fn ($i) => $i['unit_price'] * $i['quantity']);

            $order = Order::create([
                'user_id'        => $request->user()->id,
                'business_id'    => $validated['business_id'],
                'total_price'    => $total,
                'status'         => 'pending',
                'payment_method' => $validated['payment_method'],
            ]);

            foreach ($validated['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
            }

            return $order;
        });

        $order->load('business:id,name');

        return response()->json([
            'id'            => $order->id,
            'code'          => '#ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
            'status'        => $order->status,
            'total_price'   => $order->total_price,
            'business_name' => $order->business->name,
        ], 201);
    }

    /**
     * GET /api/orders
     * Returns all orders for the authenticated user (customer).
     */
    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with([
                'business:id,name,address,city',
                'items.product:id,name,price,price_unit,business_id',
            ])
            ->latest()
            ->get()
            ->map(function ($order) {
                return [
                    'id'             => $order->id,
                    'code'           => 'ORD-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                    'status'         => $order->status,
                    'total_price'    => $order->total_price,
                    'payment_method' => $order->payment_method,
                    'pickup_date'    => $order->pickup_date,
                    'created_at'     => $order->created_at,
                    'business_id'    => $order->business_id,
                    'business_name'  => $order->business?->name,
                    'business_address' => trim(($order->business?->address ?? '') . ', ' . ($order->business?->city ?? ''), ', '),
                    'items_count'    => $order->items->count(),
                    'items'          => $order->items->map(fn($item) => [
                        'product_id'   => $item->product_id,
                        'product_name' => $item->product?->name,
                        'price'        => $item->product?->price,
                        'price_unit'   => $item->product?->price_unit,
                        'unit_price'   => $item->unit_price,
                        'quantity'     => $item->quantity,
                        'subtotal'     => round($item->unit_price * $item->quantity, 2),
                    ]),
                ];
            });

        return response()->json($orders);
    }

    /**
     * GET /api/mis-pedidos-productor
     * Returns all orders for the authenticated business owner.
     */
    public function businessOrders(Request $request)
    {
        $user = $request->user();
        $business = $user->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 403);
        }

        $orders = Order::where('business_id', $business->id)
            ->with([
                'user:id,name,email',
                'items.product:id,name,price,price_unit',
            ])
            ->latest()
            ->get()
            ->map(function ($order) {
                return [
                    'id'             => $order->id,
                    'code'           => 'ORD-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                    'status'         => $order->status,
                    'total_price'    => $order->total_price,
                    'payment_method' => $order->payment_method,
                    'pickup_date'    => $order->pickup_date,
                    'created_at'     => $order->created_at,
                    'client_name'    => $order->user?->name,
                    'client_email'   => $order->user?->email,
                    'items_count'    => $order->items->count(),
                    'items'          => $order->items->map(fn($item) => [
                        'product_id'   => $item->product_id,
                        'product_name' => $item->product?->name,
                        'unit_price'   => $item->unit_price,
                        'quantity'     => $item->quantity,
                        'subtotal'     => round($item->unit_price * $item->quantity, 2),
                    ]),
                ];
            });

        return response()->json($orders);
    }

    /**
     * PATCH /api/mis-pedidos-productor/{id}/status
     * Updates the status of an order belonging to the authenticated business.
     */
    public function updateStatus(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,listo,completed,cancelled',
        ]);

        $user = $request->user();
        $business = $user->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 403);
        }

        $order = Order::where('id', $id)->where('business_id', $business->id)->first();

        if (!$order) {
            return response()->json(['message' => 'Pedido no encontrado.'], 404);
        }

        $order->update(['status' => $validated['status']]);

        return response()->json([
            'id'     => $order->id,
            'status' => $order->status,
        ]);
    }
}
