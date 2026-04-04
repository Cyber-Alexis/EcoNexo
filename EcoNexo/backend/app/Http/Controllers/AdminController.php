<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Get all users with optional filtering
     */
    public function getAllUsers(Request $request)
    {
        $query = User::query();

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
        $statistics = [
            'total_users' => User::count(),
            'admin_users' => User::where('role', 'admin')->count(),
            'business_users' => User::where('role', 'business')->count(),
            'consumer_users' => User::where('role', 'consumer')->count(),
            'active_users' => User::where('status', 'activo')->count(),
            'inactive_users' => User::where('status', 'inactivo')->count(),
            'blocked_users' => User::where('status', 'bloqueado')->count(),
            'pending_users' => User::where('status', 'pendiente')->count(),
            'recent_users' => User::latest('created_at')->take(5)->get(['id', 'name', 'last_name', 'email', 'role', 'status', 'created_at']),
        ];

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ], 200);
    }
}
