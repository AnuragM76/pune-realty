import pool from './db';
import { PUNE_LOCALITIES } from './puneData';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Pune Localities Master Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pune_localities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        zone VARCHAR(50) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        lat NUMERIC(9,6) NOT NULL,
        lng NUMERIC(9,6) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Listings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        listing_type VARCHAR(10) NOT NULL CHECK (listing_type IN ('Sale', 'Rent')),
        property_category VARCHAR(50) NOT NULL CHECK (
          property_category IN ('Apartment/Flat', 'Independent House', 'Villa', 'Plot/Land', 'Office', 'Shop', 'Warehouse')
        ),
        bhk VARCHAR(20),
        carpet_area_sqft NUMERIC(10,2) NOT NULL,
        builtup_area_sqft NUMERIC(10,2),
        floor_number INTEGER,
        total_floors INTEGER,
        age_of_property VARCHAR(50),
        facing_direction VARCHAR(30),
        furnishing_status VARCHAR(30) CHECK (furnishing_status IN ('Unfurnished', 'Semi-Furnished', 'Fully-Furnished', 'N/A')),
        bathrooms INTEGER DEFAULT 1,
        balconies INTEGER DEFAULT 0,
        parking VARCHAR(50),
        possession_status VARCHAR(50) NOT NULL,
        possession_date DATE,
        
        -- Pricing
        price NUMERIC(14,2) NOT NULL,
        deposit NUMERIC(14,2) DEFAULT 0,
        maintenance_charges NUMERIC(10,2) DEFAULT 0,
        price_per_sqft NUMERIC(10,2),
        is_negotiable BOOLEAN DEFAULT FALSE,

        -- Location (Strict Pune)
        locality VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        lat NUMERIC(9,6) NOT NULL,
        lng NUMERIC(9,6) NOT NULL,

        -- Preferred Tenants (Rent only)
        preferred_tenants VARCHAR(50) DEFAULT 'Any',

        -- Description & Flags
        description TEXT NOT NULL,
        has_contact_leak_flag BOOLEAN DEFAULT FALSE,
        contact_leak_notes TEXT,
        video_url VARCHAR(500),
        cover_image VARCHAR(500),

        -- Status & Workflow
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'rented', 'inactive')),
        rejection_reason TEXT,
        is_featured BOOLEAN DEFAULT FALSE,
        views_count INTEGER DEFAULT 0,
        is_deleted BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Listing Images Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS listing_images (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        caption VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Amenities Table & Junction
    await client.query(`
      CREATE TABLE IF NOT EXISTS amenities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS listing_amenities (
        listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
        PRIMARY KEY (listing_id, amenity_id)
      );
    `);

    // 6. Owner Details (Strictly Private - Admin Broker Access Only)
    await client.query(`
      CREATE TABLE IF NOT EXISTS owner_details (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER UNIQUE NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        owner_name VARCHAR(150) NOT NULL,
        owner_phone VARCHAR(30) NOT NULL,
        owner_email VARCHAR(255),
        owner_address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Inquiries Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        preferred_visit_time VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
        broker_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Saved Properties Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_properties (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, listing_id)
      );
    `);

    // 9. Admin Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Platform Settings (Broker Public Contact details and moderation)
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description VARCHAR(255)
      );
    `);

    // Populate Initial Amenities
    const defaultAmenities = [
      'Lift', 'Power Backup', 'Gymnasium', 'Swimming Pool', 'Clubhouse',
      '24x7 Security', 'Gated Community', 'Reserved Parking', 'Visitor Parking',
      'Children Play Area', 'Intercom', 'Gas Pipeline', 'Rain Water Harvesting',
      'Fire Fighting System', 'Park / Garden', 'Water Storage'
    ];
    for (const am of defaultAmenities) {
      await client.query(`
        INSERT INTO amenities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;
      `, [am]);
    }

    // Populate Initial Localities
    for (const loc of PUNE_LOCALITIES) {
      await client.query(`
        INSERT INTO pune_localities (name, zone, pincode, lat, lng)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO UPDATE SET
          zone = EXCLUDED.zone,
          pincode = EXCLUDED.pincode,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng;
      `, [loc.name, loc.zone, loc.pincode, loc.lat, loc.lng]);
    }

    // Populate Default Platform Settings
    const defaultSettings = [
      { key: 'broker_name', value: 'Pune Prime Properties (Broker Admin)', desc: 'Broker name displayed on all listings' },
      { key: 'broker_phone', value: '+91 98220 12345', desc: 'Broker phone displayed publicly' },
      { key: 'broker_email', value: 'contact@puneprimeproperties.in', desc: 'Broker inquiry routing email' },
      { key: 'broker_office', value: 'FC Road, Deccan Gymkhana, Pune 411004', desc: 'Broker registered office in Pune' },
      { key: 'site_name', value: 'PuneRealty', desc: 'Platform brand name' },
      { key: 'auto_flag_contacts', value: 'true', desc: 'Automatically flag phone/email in descriptions' },
    ];
    for (const s of defaultSettings) {
      await client.query(`
        INSERT INTO platform_settings (key, value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO NOTHING;
      `, [s.key, s.value, s.desc]);
    }

    await client.query('COMMIT');
    console.log('✓ Database schema created and baseline seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
