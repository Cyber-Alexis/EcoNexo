<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Get all available product categories.
     */
    public function categories()
    {
        $categories = Category::whereHas('products', function ($query) {
            $query->where('active', true);
        })
        ->orderBy('name', 'asc')
        ->pluck('name');

        return response()->json(['categories' => $categories]);
    }

    /**
     * Display a listing of all products with pagination.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 12);
        $category = $request->get('category');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = Product::with(['business', 'category', 'images'])
            ->where('active', true);

        // Filter by category
        if ($category && $category !== 'Todas') {
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('name', $category);
            });
        }

        // Search in name, description, business name or category
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhereHas('business', function ($bq) use ($search) {
                        $bq->where('name', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        // Sorting
        if ($sortBy === 'price') {
            $query->orderBy('price', $sortOrder);
        } else {
            $query->orderBy('name', $sortOrder);
        }

        return response()->json($query->paginate($perPage));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        //
    }
}
