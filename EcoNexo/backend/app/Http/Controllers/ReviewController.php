<?php

namespace App\Http\Controllers;

use App\Models\BusinessReview;
use App\Models\Order;
use App\Models\ProductReview;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * GET /api/resenas
     * Returns all product + business reviews written by the authenticated user.
     */
    public function index()
    {
        $user = auth('api')->user();

        $productReviews = ProductReview::with(['product.business'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'type'         => 'product',
                'rating'       => $r->rating,
                'comment'      => $r->comment,
                'created_at'   => $r->created_at,
                'product_id'   => $r->product_id,
                'product_name' => $r->product?->name,
                'business_name'=> $r->product?->business?->name,
            ]);

        $businessReviews = BusinessReview::with(['business'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'type'         => 'business',
                'rating'       => $r->rating,
                'comment'      => $r->comment,
                'created_at'   => $r->created_at,
                'business_id'  => $r->business_id,
                'business_name'=> $r->business?->name,
            ]);

        $all = $productReviews->concat($businessReviews)
            ->sortByDesc('created_at')
            ->values();

        $avgRating = $all->count()
            ? round($all->avg('rating'), 1)
            : 0;

        return response()->json([
            'reviews'    => $all,
            'total'      => $all->count(),
            'avg_rating' => $avgRating,
        ]);
    }

    /**
     * GET /api/resenas/pendientes
     * Returns products from completed orders that the user hasn't reviewed yet.
     */
    public function pending()
    {
        $user = auth('api')->user();

        $reviewedProductIds = ProductReview::where('user_id', $user->id)
            ->pluck('product_id')
            ->toArray();

        $reviewedBusinessIds = BusinessReview::where('user_id', $user->id)
            ->pluck('business_id')
            ->toArray();

        $orders = Order::with(['items.product', 'business'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['completed', 'entregado'])
            ->get();

        $pendingProducts = collect();
        $pendingBusinesses = collect();

        foreach ($orders as $order) {
            // Pending product reviews
            foreach ($order->items as $item) {
                if ($item->product && !in_array($item->product_id, $reviewedProductIds)) {
                    $reviewedProductIds[] = $item->product_id; // avoid duplicates
                    $pendingProducts->push([
                        'type'          => 'product',
                        'product_id'    => $item->product_id,
                        'product_name'  => $item->product->name,
                        'business_name' => $order->business?->name,
                        'business_id'   => $order->business_id,
                        'order_id'      => $order->id,
                    ]);
                }
            }

            // Pending business review
            if ($order->business && !in_array($order->business_id, $reviewedBusinessIds)) {
                $reviewedBusinessIds[] = $order->business_id;
                $pendingBusinesses->push([
                    'type'          => 'business',
                    'business_id'   => $order->business_id,
                    'business_name' => $order->business->name,
                    'order_id'      => $order->id,
                ]);
            }
        }

        $pending = $pendingProducts->concat($pendingBusinesses)->values();

        return response()->json([
            'pending' => $pending,
            'total'   => $pending->count(),
        ]);
    }

    /**
     * POST /api/resenas/producto
     */
    public function storeProduct(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        $user = auth('api')->user();

        // Only users with a completed order containing this product may review it
        $hasOrder = Order::where('user_id', $user->id)
            ->whereIn('status', ['completed', 'entregado'])
            ->whereHas('items', fn ($q) => $q->where('product_id', $data['product_id']))
            ->exists();

        if (!$hasOrder) {
            return response()->json(['message' => 'Solo puedes reseñar productos de pedidos completados.'], 403);
        }

        $existing = ProductReview::where('user_id', $user->id)
            ->where('product_id', $data['product_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Ya has reseñado este producto.'], 422);
        }

        $review = ProductReview::create([
            'user_id'    => $user->id,
            'product_id' => $data['product_id'],
            'rating'     => $data['rating'],
            'comment'    => $data['comment'] ?? null,
        ]);

        return response()->json(['review' => $review], 201);
    }

    /**
     * POST /api/resenas/negocio
     */
    public function storeBusiness(Request $request)
    {
        $data = $request->validate([
            'business_id' => 'required|exists:businesses,id',
            'rating'      => 'required|integer|min:1|max:5',
            'comment'     => 'nullable|string|max:1000',
        ]);

        $user = auth('api')->user();

        // Only users with a completed order from this business may review it
        $hasOrder = Order::where('user_id', $user->id)
            ->where('business_id', $data['business_id'])
            ->whereIn('status', ['completed', 'entregado'])
            ->exists();

        if (!$hasOrder) {
            return response()->json(['message' => 'Solo puedes reseñar negocios en los que hayas completado un pedido.'], 403);
        }

        $existing = BusinessReview::where('user_id', $user->id)
            ->where('business_id', $data['business_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Ya has reseñado este negocio.'], 422);
        }

        $review = BusinessReview::create([
            'user_id'     => $user->id,
            'business_id' => $data['business_id'],
            'rating'      => $data['rating'],
            'comment'     => $data['comment'] ?? null,
        ]);

        return response()->json(['review' => $review], 201);
    }

    /**
     * PUT /api/resenas/producto/{id}
     */
    public function updateProduct(Request $request, int $id)
    {
        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user   = auth('api')->user();
        $review = ProductReview::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $review->update($data);

        return response()->json(['review' => $review]);
    }

    /**
     * PUT /api/resenas/negocio/{id}
     */
    public function updateBusiness(Request $request, int $id)
    {
        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user   = auth('api')->user();
        $review = BusinessReview::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $review->update($data);

        return response()->json(['review' => $review]);
    }

    /**
     * DELETE /api/resenas/producto/{id}
     */
    public function destroyProduct(int $id)
    {
        $user   = auth('api')->user();
        $review = ProductReview::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $review->delete();

        return response()->json(['message' => 'Reseña eliminada.']);
    }

    /**
     * DELETE /api/resenas/negocio/{id}
     */
    public function destroyBusiness(int $id)
    {
        $user   = auth('api')->user();
        $review = BusinessReview::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $review->delete();

        return response()->json(['message' => 'Reseña eliminada.']);
    }
}
