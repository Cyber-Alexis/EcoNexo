<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($this->buildCartResponse($request->user()->id));
    }

    public function sync(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $userId = $request->user()->id;
        $items = collect($validated['items'] ?? [])
            ->groupBy('product_id')
            ->map(fn ($group) => $group->sum('quantity'));

        DB::transaction(function () use ($items, $userId) {
            if ($items->isEmpty()) {
                CartItem::where('user_id', $userId)->delete();
                return;
            }

            CartItem::where('user_id', $userId)
                ->whereNotIn('product_id', $items->keys()->all())
                ->delete();

            foreach ($items as $productId => $quantity) {
                CartItem::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'product_id' => (int) $productId,
                    ],
                    [
                        'quantity' => (int) $quantity,
                    ],
                );
            }
        });

        return response()->json($this->buildCartResponse($userId));
    }

    public function clear(Request $request)
    {
        CartItem::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Carrito vaciado correctamente.',
        ]);
    }

    private function buildCartResponse(int $userId): array
    {
        return CartItem::where('user_id', $userId)
            ->with([
                'product.business:id,name,opening_hours',
                'product.images:id,path,imageable_id,imageable_type,type',
            ])
            ->get()
            ->filter(fn (CartItem $item) => $item->product !== null)
            ->map(function (CartItem $item) {
                $product = $item->product;
                $business = $product->business;
                $image = $product->images->first();

                return [
                    'id' => sprintf('%s::%s', $product->business_id, $product->id),
                    'productId' => $product->id,
                    'businessId' => $product->business_id,
                    'name' => $product->name,
                    'price' => (float) $product->price,
                    'priceUnit' => $product->price_unit ?? 'unidad',
                    'img' => $image?->path ?? 'https://placehold.co/300x300?text=Sin+imagen',
                    'quantity' => $item->quantity,
                    'business' => $business?->name ?? 'Negocio',
                    'openingHours' => $business?->opening_hours,
                ];
            })
            ->values()
            ->all();
    }
}
