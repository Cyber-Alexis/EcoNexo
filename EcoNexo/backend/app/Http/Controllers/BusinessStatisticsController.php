<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\BusinessReview;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessStatisticsController extends Controller
{
    /**
     * GET /api/mis-estadisticas
     * Returns business statistics for the authenticated producer.
     */
    public function index(Request $request)
    {
        $business = $request->user()->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 403);
        }

        $businessId = $business->id;

        // ── KPI: Total revenue (all completed/confirmed/listo orders) ──────────
        $totalRevenue = Order::where('business_id', $businessId)
            ->whereIn('status', ['completed', 'listo', 'confirmed'])
            ->sum('total_price');

        // ── KPI: Completed orders ──────────────────────────────────────────────
        $completedOrders = Order::where('business_id', $businessId)
            ->whereIn('status', ['completed', 'listo', 'confirmed', 'pending'])
            ->count();

        // ── KPI: Unique clients ────────────────────────────────────────────────
        $uniqueClients = Order::where('business_id', $businessId)
            ->distinct('user_id')
            ->count('user_id');

        // ── KPI: Average review rating ─────────────────────────────────────────
        $avgRating = BusinessReview::where('business_id', $businessId)->avg('rating') ?? 0;
        $totalReviews = BusinessReview::where('business_id', $businessId)->count();

        // ── Monthly sales — last 7 months ──────────────────────────────────────
        $monthlySales = Order::where('business_id', $businessId)
            ->whereIn('status', ['completed', 'listo', 'confirmed', 'pending'])
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->select(
                DB::raw('YEAR(created_at)  AS year'),
                DB::raw('MONTH(created_at) AS month'),
                DB::raw('SUM(total_price)  AS total'),
                DB::raw('COUNT(*)          AS orders')
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Fill all 7 months (including months with 0)
        $months = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $y = (int) $date->format('Y');
            $m = (int) $date->format('n');
            $row = $monthlySales->first(fn($r) => $r->year === $y && $r->month === $m);
            $months[] = [
                'label'  => $date->locale('es')->isoFormat('MMM'),
                'year'   => $y,
                'month'  => $m,
                'total'  => $row ? round((float) $row->total, 2) : 0,
                'orders' => $row ? (int) $row->orders : 0,
            ];
        }

        // ── Top selling products ───────────────────────────────────────────────
        $topProducts = OrderItem::whereHas('order', fn($q) => $q->where('business_id', $businessId))
            ->select('product_id', DB::raw('SUM(quantity) AS units_sold'), DB::raw('SUM(unit_price * quantity) AS revenue'))
            ->groupBy('product_id')
            ->orderByDesc('units_sold')
            ->with('product:id,name')
            ->limit(5)
            ->get()
            ->map(function ($item, $index) use ($businessId) {
                // Compare with previous period (last 30 days vs prior 30 days)
                $now = now();
                $recentUnits = OrderItem::where('product_id', $item->product_id)
                    ->whereHas('order', fn($q) => $q->where('business_id', $businessId)
                        ->where('created_at', '>=', $now->copy()->subDays(30)))
                    ->sum('quantity');
                $priorUnits = OrderItem::where('product_id', $item->product_id)
                    ->whereHas('order', fn($q) => $q->where('business_id', $businessId)
                        ->whereBetween('created_at', [$now->copy()->subDays(60), $now->copy()->subDays(30)]))
                    ->sum('quantity');

                $trend = $recentUnits >= $priorUnits ? 'up' : 'down';

                return [
                    'rank'       => $index + 1,
                    'name'       => $item->product?->name ?? 'Producto eliminado',
                    'units_sold' => (int) $item->units_sold,
                    'revenue'    => round((float) $item->revenue, 2),
                    'trend'      => $trend,
                ];
            });

        // ── Recent reviews ─────────────────────────────────────────────────────
        $recentReviews = BusinessReview::where('business_id', $businessId)
            ->with('user:id,name')
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn($r) => [
                'author'  => $r->user?->name ?? 'Cliente',
                'rating'  => (float) $r->rating,
                'comment' => $r->comment,
                'ago'     => $r->created_at->diffForHumans(),
            ]);

        // ── Previous month comparison ──────────────────────────────────────────
        $thisMonth = Order::where('business_id', $businessId)
            ->whereIn('status', ['completed', 'listo', 'confirmed', 'pending'])
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('total_price');

        $lastMonth = Order::where('business_id', $businessId)
            ->whereIn('status', ['completed', 'listo', 'confirmed', 'pending'])
            ->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->sum('total_price');

        $revenueChange = $lastMonth > 0
            ? round((($thisMonth - $lastMonth) / $lastMonth) * 100, 1)
            : ($thisMonth > 0 ? 100 : 0);

        $prevCompletedOrders = Order::where('business_id', $businessId)
            ->whereIn('status', ['completed', 'listo', 'confirmed', 'pending'])
            ->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->count();
        $thisCompletedOrders = Order::where('business_id', $businessId)
            ->whereIn('status', ['completed', 'listo', 'confirmed', 'pending'])
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
        $ordersChange = $prevCompletedOrders > 0
            ? round((($thisCompletedOrders - $prevCompletedOrders) / $prevCompletedOrders) * 100, 1)
            : ($thisCompletedOrders > 0 ? 100 : 0);

        return response()->json([
            'kpis' => [
                'total_revenue'    => round((float) $totalRevenue, 2),
                'completed_orders' => $completedOrders,
                'unique_clients'   => $uniqueClients,
                'avg_rating'       => round((float) $avgRating, 1),
                'total_reviews'    => $totalReviews,
                'revenue_change'   => $revenueChange,
                'orders_change'    => $ordersChange,
            ],
            'monthly_sales' => $months,
            'top_products'  => $topProducts,
            'recent_reviews' => $recentReviews,
        ]);
    }
}
