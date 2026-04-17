<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Order;
use App\Models\Product;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Get all users with optional filtering
     */
    public function getAllUsers(Request $request)
    {
        $query = User::query()->withCount('orders');

        // Filtrado por rol
        if ($request->has('role') && $request->role !== 'todos') {
            $query->where('role', $request->role);
        }

        // Filtrado por estado
        if ($request->has('status') && $request->status !== 'todos') {
            $query->where('status', $request->status);
        }

        // Búsqueda por nombre o email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('last_name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        // Ordenamiento
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $users = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $users,
        ], 200);
    }

    /**
     * Get a single user
     */
    public function getUserById($id)
    {
        $user = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ], 200);
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['admin', 'business', 'consumer'])],
            'status' => ['required', Rule::in(['activo', 'inactivo', 'bloqueado', 'pendiente'])],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Usuario creado exitosamente',
            'data' => $user,
        ], 201);
    }

    /**
     * Update user information
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['sometimes', Rule::in(['admin', 'business', 'consumer'])],
            'status' => ['sometimes', Rule::in(['activo', 'inactivo', 'bloqueado', 'pendiente'])],
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:100',
            'postal_code' => 'sometimes|nullable|string|max:20',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'data' => $user,
        ], 200);
    }

    /**
     * Change user status
     */
    public function changeUserStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['activo', 'inactivo', 'bloqueado', 'pendiente'])],
        ]);

        $user->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Estado del usuario actualizado exitosamente',
            'data' => $user,
        ], 200);
    }

    /**
     * Delete a user
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        // Prevenir eliminar al usuario admin principal
        if ($user->role === 'admin' && User::where('role', 'admin')->count() === 1) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar el único usuario administrador',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente',
        ], 200);
    }

    /**
     * Get admin statistics
     */
    public function getStatistics()
    {
        $now = now();
        $today = $now->copy()->startOfDay();
        $yesterday = $today->copy()->subDay();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $startOfMonth->copy()->subMonthNoOverflow();
        $endOfLastMonth = $startOfMonth->copy()->subSecond();

        $totalUsers = User::count();
        $adminUsers = User::where('role', 'admin')->count();
        $businessUsers = User::where('role', 'business')->count();
        $consumerUsers = User::where('role', 'consumer')->count();
        $activeUsers = User::where('status', 'activo')->count();
        $inactiveUsers = User::where('status', 'inactivo')->count();
        $blockedUsers = User::where('status', 'bloqueado')->count();
        $pendingUsers = User::where('status', 'pendiente')->count();

        $previousTotalUsers = User::where('created_at', '<', $startOfMonth)->count();
        $ordersToday = Order::where('created_at', '>=', $today)->count();
        $ordersYesterday = Order::whereBetween('created_at', [$yesterday, $today])->count();
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $completedOrders = Order::where('status', 'completed')->count();
        $confirmedOrders = Order::where('status', 'confirmed')->count();
        $cancelledOrders = Order::where('status', 'cancelled')->count();

        $totalBusinesses = Business::count();
        $activeBusinesses = Business::where('status', 'active')->count();
        $previousActiveBusinesses = Business::where('status', 'active')
            ->where('created_at', '<', $startOfMonth)
            ->count();

        $totalProducts = Product::count();
        $activeProducts = Product::where('active', true)->count();
        $productsWithStock = Product::where('active', true)
            ->where('stock', '>', 0)
            ->count();

        $monthlyRevenue = (float) Order::whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('created_at', [$startOfMonth, $now])
            ->sum('total_price');

        $previousMonthRevenue = (float) Order::whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total_price');

        $dbStartedAt = microtime(true);
        DB::select('select 1');
        $databaseLatencyMs = (int) round((microtime(true) - $dbStartedAt) * 1000);

        $configuredPaymentMethods = Order::query()
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', '')
            ->distinct()
            ->count('payment_method');

        $recentUsers = User::latest('created_at')
            ->take(5)
            ->get(['id', 'name', 'last_name', 'email', 'role', 'status', 'created_at']);

        $statistics = [
            'total_users' => $totalUsers,
            'admin_users' => $adminUsers,
            'business_users' => $businessUsers,
            'consumer_users' => $consumerUsers,
            'active_users' => $activeUsers,
            'inactive_users' => $inactiveUsers,
            'blocked_users' => $blockedUsers,
            'pending_users' => $pendingUsers,
            'total_orders' => $totalOrders,
            'orders_today' => $ordersToday,
            'pending_orders' => $pendingOrders,
            'completed_orders' => $completedOrders,
            'confirmed_orders' => $confirmedOrders,
            'cancelled_orders' => $cancelledOrders,
            'total_businesses' => $totalBusinesses,
            'active_businesses' => $activeBusinesses,
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'products_with_stock' => $productsWithStock,
            'monthly_revenue' => round($monthlyRevenue, 2),
            'previous_month_revenue' => round($previousMonthRevenue, 2),
            'recent_users' => $recentUsers,
            'overview_cards' => [
                [
                    'key' => 'total_users',
                    'label' => 'Usuarios Totales',
                    'value' => $totalUsers,
                    'format' => 'number',
                    'change_percentage' => $this->calculateChangePercentage($totalUsers, $previousTotalUsers),
                    'comparison_label' => 'respecto al inicio de mes',
                ],
                [
                    'key' => 'orders_today',
                    'label' => 'Pedidos Hoy',
                    'value' => $ordersToday,
                    'format' => 'number',
                    'change_percentage' => $this->calculateChangePercentage($ordersToday, $ordersYesterday),
                    'comparison_label' => 'respecto a ayer',
                ],
                [
                    'key' => 'active_businesses',
                    'label' => 'Negocios Activos',
                    'value' => $activeBusinesses,
                    'format' => 'number',
                    'change_percentage' => $this->calculateChangePercentage($activeBusinesses, $previousActiveBusinesses),
                    'comparison_label' => 'respecto al inicio de mes',
                ],
                [
                    'key' => 'monthly_revenue',
                    'label' => 'Ingresos Mes',
                    'value' => round($monthlyRevenue, 2),
                    'format' => 'currency',
                    'change_percentage' => $this->calculateChangePercentage($monthlyRevenue, $previousMonthRevenue),
                    'comparison_label' => 'respecto al mes anterior',
                ],
            ],
            'system_status' => [
                [
                    'key' => 'api',
                    'label' => 'API Backend',
                    'detail' => 'Ultima comprobacion correcta',
                    'metric' => 'Online',
                    'status' => 'operativo',
                ],
                [
                    'key' => 'database',
                    'label' => 'Base de Datos',
                    'detail' => 'Conexion ' . DB::connection()->getName(),
                    'metric' => $databaseLatencyMs . ' ms',
                    'status' => $databaseLatencyMs <= 150 ? 'operativo' : 'mantenimiento',
                ],
                [
                    'key' => 'storage',
                    'label' => 'Almacenamiento',
                    'detail' => 'Disco ' . config('filesystems.default', 'local'),
                    'metric' => is_writable(storage_path('app')) ? 'Escritura OK' : 'Solo lectura',
                    'status' => is_writable(storage_path('app')) ? 'operativo' : 'alerta',
                ],
                [
                    'key' => 'payments',
                    'label' => 'Pasarela de Pago',
                    'detail' => 'Metodos detectados en pedidos',
                    'metric' => $configuredPaymentMethods > 0 ? $configuredPaymentMethods . ' activos' : 'Sin configurar',
                    'status' => $configuredPaymentMethods > 0 ? 'operativo' : 'mantenimiento',
                ],
            ],
            'recent_activity' => $this->buildRecentActivity(),
            'last_updated_at' => $now->toIso8601String(),
        ];

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ], 200);
    }

    public function getSettings()
    {
        return response()->json([
            'success' => true,
            'data' => $this->buildSettingsPayload(),
        ], 200);
    }

    public function updateGeneralSettings(Request $request)
    {
        $validated = $request->validate([
            'platform_name' => 'required|string|max:120',
            'contact_email' => 'required|email|max:255',
            'sales_commission_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $this->upsertSetting('general', [
            'platform_name' => $validated['platform_name'],
            'contact_email' => $validated['contact_email'],
            'sales_commission_percentage' => round((float) $validated['sales_commission_percentage'], 2),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Configuración general actualizada correctamente.',
            'data' => $this->buildSettingsPayload(),
        ], 200);
    }

    public function updateNotificationSettings(Request $request)
    {
        $validated = $request->validate([
            'security_alerts' => 'required|boolean',
            'new_registrations' => 'required|boolean',
            'product_reports' => 'required|boolean',
            'backups' => 'required|boolean',
        ]);

        $this->upsertSetting('notifications', $validated);

        return response()->json([
            'success' => true,
            'message' => 'Preferencias de notificación actualizadas.',
            'data' => $this->buildSettingsPayload(),
        ], 200);
    }

    public function updateMaintenanceSettings(Request $request)
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $current = $this->getStoredSettings()['maintenance'] ?? [];

        $this->upsertSetting('maintenance', array_merge($current, [
            'enabled' => $validated['enabled'],
            'last_platform_update_at' => $current['last_platform_update_at'] ?? now()->toIso8601String(),
            'last_checked_at' => $current['last_checked_at'] ?? now()->toIso8601String(),
            'app_version' => $current['app_version'] ?? $this->getApplicationVersion(),
            'update_status_message' => $validated['enabled']
                ? 'Modo mantenimiento activado para usuarios no administradores.'
                : 'Modo mantenimiento desactivado.',
        ]));

        return response()->json([
            'success' => true,
            'message' => $validated['enabled']
                ? 'Modo mantenimiento activado.'
                : 'Modo mantenimiento desactivado.',
            'data' => $this->buildSettingsPayload(),
        ], 200);
    }

    public function checkForUpdates()
    {
        $stored = $this->getStoredSettings()['maintenance'] ?? [];
        $checkedAt = now()->toIso8601String();

        $this->upsertSetting('maintenance', array_merge($stored, [
            'enabled' => (bool) ($stored['enabled'] ?? false),
            'app_version' => $stored['app_version'] ?? $this->getApplicationVersion(),
            'last_platform_update_at' => $stored['last_platform_update_at'] ?? now()->toIso8601String(),
            'last_checked_at' => $checkedAt,
            'update_status_message' => 'No hay nuevas actualizaciones automáticas disponibles en este entorno.',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Comprobación de actualizaciones completada.',
            'data' => $this->buildSettingsPayload(),
        ], 200);
    }

    /**
     * Get analytics data from real database records
     */
    public function getAnalytics()
    {
        $now = now();
        $today = $now->copy()->startOfDay();
        $startOfThisWeek = $now->copy()->subDays(6)->startOfDay();
        $startOfPrevWeek = $startOfThisWeek->copy()->subDays(7);
        $prevMonthStart = $now->copy()->subMonth()->startOfMonth();
        $prevMonthEnd = $now->copy()->subMonth()->endOfMonth();

        // ── KPIs ──────────────────────────────────────────────
        $ordersToday = Order::where('created_at', '>=', $today)->count();
        $ordersYesterday = Order::whereBetween('created_at', [
            $today->copy()->subDay(), $today,
        ])->count();

        $totalOrders = Order::count();
        $completedOrders = Order::whereIn('status', ['confirmed', 'completed'])->count();
        $conversionRate = $totalOrders > 0 ? round($completedOrders / $totalOrders * 100, 1) : 0.0;

        $prevTotalOrders = Order::whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])->count();
        $prevCompletedOrders = Order::whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])
            ->count();
        $prevConversionRate = $prevTotalOrders > 0 ? round($prevCompletedOrders / $prevTotalOrders * 100, 1) : 0.0;
        $conversionChange = round($conversionRate - $prevConversionRate, 1);

        $newUsersThisWeek = User::where('created_at', '>=', $startOfThisWeek)->count();
        $newUsersPrevWeek = User::whereBetween('created_at', [$startOfPrevWeek, $startOfThisWeek])->count();

        $avgTicket = (float) (Order::whereIn('status', ['confirmed', 'completed'])->avg('total_price') ?? 0);
        $prevAvgTicket = (float) (Order::whereIn('status', ['confirmed', 'completed'])
            ->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])
            ->avg('total_price') ?? 0);

        $kpis = [
            [
                'label' => 'Pedidos Hoy',
                'value' => (string) $ordersToday,
                'icon_key' => 'orders',
                'change_label' => $this->buildChangeLabel($ordersToday, $ordersYesterday, 'vs ayer'),
                'change_positive' => $ordersToday >= $ordersYesterday,
            ],
            [
                'label' => 'Tasa Conversión',
                'value' => $conversionRate . '%',
                'icon_key' => 'conversion',
                'change_label' => ($conversionChange >= 0 ? '+' : '') . $conversionChange . '% este mes',
                'change_positive' => $conversionChange >= 0,
            ],
            [
                'label' => 'Nuevos Usuarios',
                'value' => (string) $newUsersThisWeek,
                'icon_key' => 'users',
                'change_label' => 'Esta semana',
                'change_positive' => $newUsersThisWeek >= $newUsersPrevWeek,
            ],
            [
                'label' => 'Ticket Medio',
                'value' => '€' . number_format($avgTicket, 2, '.', ''),
                'icon_key' => 'ticket',
                'change_label' => $this->buildChangeLabel($avgTicket, $prevAvgTicket, 'vs mes anterior'),
                'change_positive' => $avgTicket >= $prevAvgTicket,
            ],
        ];

        // ── Monthly Sales (last 6 months) ─────────────────────
        $spanishMonths = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        $monthlySales = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $now->copy()->subMonths($i)->startOfMonth();
            $monthEnd   = $now->copy()->subMonths($i)->endOfMonth();
            $revenue = (float) Order::whereIn('status', ['confirmed', 'completed'])
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('total_price');
            $monthlySales[] = [
                'month'   => $spanishMonths[(int) $monthStart->format('n')],
                'revenue' => round($revenue, 2),
            ];
        }

        // ── Weekly Traffic (orders per day, last 7 days) ──────
        $dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        $weeklyTraffic = [];
        for ($i = 6; $i >= 0; $i--) {
            $dayStart = $now->copy()->subDays($i)->startOfDay();
            $dayEnd   = $now->copy()->subDays($i)->endOfDay();
            $count = Order::whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $weeklyTraffic[] = [
                'day'    => $dayLabels[$dayStart->dayOfWeek],
                'orders' => $count,
            ];
        }

        // ── Category Distribution ─────────────────────────────
        $rawCategories = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereIn('orders.status', ['confirmed', 'completed'])
            ->select('categories.name', DB::raw('SUM(order_items.quantity * order_items.unit_price) as total'))
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total')
            ->get();

        $totalCategoryRevenue = $rawCategories->sum('total');
        $categoryDistribution = $rawCategories->map(function ($item) use ($totalCategoryRevenue) {
            return [
                'name'       => $item->name,
                'total'      => round((float) $item->total, 2),
                'percentage' => $totalCategoryRevenue > 0
                    ? (int) round($item->total / $totalCategoryRevenue * 100)
                    : 0,
            ];
        })->values()->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'kpis'                 => $kpis,
                'monthly_sales'        => $monthlySales,
                'weekly_traffic'       => $weeklyTraffic,
                'category_distribution' => $categoryDistribution,
            ],
        ], 200);
    }

    private function buildChangeLabel(float $current, float $previous, string $suffix): string
    {
        if ($previous == 0) {
            return $suffix;
        }
        $pct = round(($current - $previous) / $previous * 100, 1);

        return ($pct >= 0 ? '+' : '') . $pct . '% ' . $suffix;
    }

    private function calculateChangePercentage(float|int $current, float|int $previous): float
    {
        if ((float) $previous === 0.0) {
            return (float) $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function buildRecentActivity()
    {
        $users = User::latest('created_at')->take(4)->get();
        $orders = Order::with(['user:id,name,last_name', 'business:id,name'])
            ->latest('created_at')
            ->take(4)
            ->get();
        $businesses = Business::with('user:id,name,last_name')
            ->latest('created_at')
            ->take(4)
            ->get();
        $products = Product::with('business:id,name')
            ->latest('created_at')
            ->take(4)
            ->get();

        return collect()
            ->merge($users->map(function (User $user) {
                return [
                    'type' => 'user',
                    'title' => 'Nuevo usuario registrado',
                    'description' => trim($user->name . ' ' . $user->last_name),
                    'status' => 'info',
                    'occurred_at' => optional($user->created_at)->toIso8601String(),
                ];
            }))
            ->merge($orders->map(function (Order $order) {
                $isCompleted = $order->status === 'completed';

                return [
                    'type' => 'order',
                    'title' => $isCompleted ? 'Pedido completado #' . $order->id : 'Nuevo pedido #' . $order->id,
                    'description' => trim(optional($order->user)->name . ' ' . optional($order->user)->last_name) ?: optional($order->business)->name,
                    'status' => $isCompleted ? 'success' : ($order->status === 'cancelled' ? 'warning' : 'info'),
                    'occurred_at' => optional($isCompleted ? $order->updated_at : $order->created_at)->toIso8601String(),
                ];
            }))
            ->merge($businesses->map(function (Business $business) {
                return [
                    'type' => 'business',
                    'title' => 'Nuevo negocio registrado',
                    'description' => $business->name,
                    'status' => 'success',
                    'occurred_at' => optional($business->created_at)->toIso8601String(),
                ];
            }))
            ->merge($products->map(function (Product $product) {
                return [
                    'type' => 'product',
                    'title' => 'Producto publicado',
                    'description' => $product->name . ' · ' . optional($product->business)->name,
                    'status' => $product->active ? 'success' : 'warning',
                    'occurred_at' => optional($product->created_at)->toIso8601String(),
                ];
            }))
            ->sortByDesc('occurred_at')
            ->take(8)
            ->values();
    }

    private function buildSettingsPayload(): array
    {
        $defaults = $this->defaultSettings();
        $stored = $this->getStoredSettings();

        $general = array_merge($defaults['general'], $stored['general'] ?? []);
        $notifications = array_merge($defaults['notifications'], $stored['notifications'] ?? []);
        $maintenance = array_merge($defaults['maintenance'], $stored['maintenance'] ?? []);

        return [
            'general' => $general,
            'notifications' => $notifications,
            'maintenance' => [
                'enabled' => (bool) ($maintenance['enabled'] ?? false),
                'app_version' => $maintenance['app_version'] ?? $this->getApplicationVersion(),
                'last_platform_update_at' => $maintenance['last_platform_update_at'] ?? now()->toIso8601String(),
                'last_checked_at' => $maintenance['last_checked_at'] ?? now()->toIso8601String(),
                'update_status_message' => $maintenance['update_status_message'] ?? '',
            ],
        ];
    }

    private function getStoredSettings(): array
    {
        return SystemSetting::query()
            ->get()
            ->mapWithKeys(fn (SystemSetting $setting) => [$setting->key => $setting->value ?? []])
            ->all();
    }

    private function upsertSetting(string $key, array $value): void
    {
        SystemSetting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );
    }

    private function defaultSettings(): array
    {
        $now = now()->toIso8601String();

        return [
            'general' => [
                'platform_name' => 'EcoNexo',
                'contact_email' => 'admin@econexo.com',
                'sales_commission_percentage' => 5,
            ],
            'notifications' => [
                'security_alerts' => true,
                'new_registrations' => true,
                'product_reports' => true,
                'backups' => false,
            ],
            'maintenance' => [
                'enabled' => false,
                'app_version' => $this->getApplicationVersion(),
                'last_platform_update_at' => $now,
                'last_checked_at' => $now,
                'update_status_message' => '',
            ],
        ];
    }

    private function getApplicationVersion(): string
    {
        $frontendPackagePath = base_path('../frontend/package.json');

        if (is_file($frontendPackagePath)) {
            $package = json_decode((string) file_get_contents($frontendPackagePath), true);
            $version = data_get($package, 'version');

            if (is_string($version) && $version !== '') {
                return 'v' . $version;
            }
        }

        return 'v1.0.0';
    }
}
