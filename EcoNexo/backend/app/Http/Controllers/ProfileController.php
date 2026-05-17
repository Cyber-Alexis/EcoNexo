<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * PUT /api/perfil
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'email'       => 'sometimes|email|max:255|unique:users,email,' . auth('api')->id(),
            'phone'       => 'nullable|string|max:30',
            'address'     => 'nullable|string|max:255',
            'city'        => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
        ]);

        $user = auth('api')->user();
        $user->update($data);

        return response()->json(['user' => $user->fresh()]);
    }

    /**
     * PUT /api/perfil/password
     */
    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6|confirmed',
        ]);

        $user = auth('api')->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'La contraseña actual no es correcta.'], 422);
        }

        $user->update(['password' => Hash::make($data['new_password'])]);

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    /**
     * DELETE /api/perfil
     */
    public function deleteAccount(Request $request)
    {
        $user = auth('api')->user();

        // 1. Eliminar avatar si existe
        $avatar = $user->avatar;
        if ($avatar) {
            Storage::disk('public')->delete($avatar->path);
            $avatar->delete();
        }

        // 2. Si es un usuario de negocio, eliminar el negocio y sus recursos
        if ($user->role === 'business') {
            $business = $user->business;
            if ($business) {
                // Eliminar imágenes del negocio
                foreach ($business->images as $image) {
                    Storage::disk('public')->delete($image->path);
                    $image->delete();
                }

                // Eliminar productos del negocio y sus recursos
                foreach ($business->products as $product) {
                    // Eliminar imágenes de productos
                    foreach ($product->images as $image) {
                        Storage::disk('public')->delete($image->path);
                        $image->delete();
                    }
                    // Las reviews de productos se eliminarán en cascada
                    $product->delete();
                }

                // Eliminar reseñas del negocio
                $business->reviews()->delete();

                // Eliminar órdenes del negocio
                foreach ($business->orders as $order) {
                    $order->items()->delete();
                    $order->delete();
                }

                // Finalmente eliminar el negocio
                $business->delete();
            }
        }

        // 3. Eliminar reseñas del usuario (tanto de productos como de negocios)
        $user->productReviews()->delete();
        $user->businessReviews()->delete();

        // 4. Eliminar órdenes del usuario (si es cliente)
        foreach ($user->orders as $order) {
            $order->items()->delete();
            $order->delete();
        }

        // 5. Eliminar items del carrito
        $user->cartItems()->delete();

        // 6. Logout y eliminar usuario
        auth('api')->logout();
        $user->delete();

        return response()->json(['message' => 'Cuenta eliminada correctamente.']);
    }

    /**
     * POST /api/perfil/avatar
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user = auth('api')->user();

        // Eliminar avatar anterior
        $oldAvatar = $user->avatar;
        if ($oldAvatar) {
            Storage::disk('public')->delete($oldAvatar->path);
            $oldAvatar->delete();
        }

        // Guardar nuevo avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->images()->create([
            'path' => $path,
            'type' => 'avatar',
        ]);

        // Refrescar usuario para obtener la relación avatar actualizada
        $user = $user->fresh();
        $avatarUrl = $user->avatar_url;

        return response()->json([
            'avatar_url' => $avatarUrl,
            'user'       => $user,
        ]);
    }

    /**
     * PUT /api/perfil/notificaciones
     */
    public function updateNotifications(Request $request)
    {
        $data = $request->validate([
            'notif_order_updates'    => 'required|boolean',
            'notif_promotions'       => 'required|boolean',
            'notif_new_products'     => 'required|boolean',
            'notif_review_responses' => 'required|boolean',
        ]);

        $user = auth('api')->user();
        $user->update($data);

        return response()->json(['user' => $user->fresh()]);
    }
}
