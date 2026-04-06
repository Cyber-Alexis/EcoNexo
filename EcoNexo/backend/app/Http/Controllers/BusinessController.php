<?php

namespace App\Http\Controllers;

use App\Models\Business;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    /**
     * GET /api/negocios
     * Returns all active businesses with avg rating, review count and main image.
     */
    public function index()
    {
        $businesses = Business::where('status', 'active')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->with([
                'images'     => fn ($q) => $q->where('type', 'main')->limit(1),
                'categories' => fn ($q) => $q->select(['id', 'business_id', 'name']),
            ])
            ->get();

        return response()->json($businesses);
    }

    /**
     * GET /api/negocios/{id}
     * Returns a single business with its products (with images), reviews (with user) and gallery images.
     */
    public function show(Business $business)
    {
        $business->load([
            'images',
            'categories' => fn ($q) => $q->select(['id', 'business_id', 'name']),
            'products' => fn ($q) => $q->where('active', true)->with('images'),
            'reviews'  => fn ($q) => $q->with('user')->latest()->limit(20),
        ]);

        $business->loadAvg('reviews', 'rating');
        $business->loadCount('reviews');

        return response()->json($business);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Business $business)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Business $business)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Business $business)
    {
        //
    }
}
