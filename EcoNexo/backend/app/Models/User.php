<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'last_name',
        'email',
        'password',
        'role',
        'status',
        'phone',
        'address',
        'city',
        'postal_code',
        'notif_order_updates',
        'notif_promotions',
        'notif_new_products',
        'notif_review_responses',
    ];

    protected $casts = [
        'notif_order_updates'     => 'boolean',
        'notif_promotions'        => 'boolean',
        'notif_new_products'      => 'boolean',
        'notif_review_responses'  => 'boolean',
    ];

    public function businesses()
    {
        return $this->hasMany(Business::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function productReviews()
    {
        return $this->hasMany(ProductReview::class);
    }

    public function businessReviews()
    {
        return $this->hasMany(BusinessReview::class);
    }

    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function avatar()
    {
        return $this->morphOne(Image::class, 'imageable')->where('type', 'avatar');
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
