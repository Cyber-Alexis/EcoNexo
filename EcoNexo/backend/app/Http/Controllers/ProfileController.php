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

        $avatar = $user->avatar;
        if ($avatar) {
            Storage::disk('public')->delete($avatar->path);
            $avatar->delete();
        }

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
            'avatar' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = auth('api')->user();

        $oldAvatar = $user->avatar;
        if ($oldAvatar) {
            Storage::disk('public')->delete($oldAvatar->path);
            $oldAvatar->delete();
        }

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->images()->create([
            'path' => $path,
            'type' => 'avatar',
        ]);

        $avatarUrl = Storage::disk('public')->url($path);

        return response()->json([
            'avatar_url' => $avatarUrl,
            'user'       => array_merge($user->toArray(), ['avatar_url' => $avatarUrl]),
        ]);
    }
}
