#!/usr/bin/env python3
"""
Script to update Hindi template for Delay category
"""

import sqlite3

def update_delay_hindi():
    """Update Hindi template for Delay category"""
    print("🚀 Updating Hindi Template for Delay Category...")
    print("=" * 50)
    
    # Connect to database
    db_path = "wras_dhh.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get Delay category ID
        cursor.execute("SELECT id FROM announcement_categories WHERE category_code = 'delay'")
        category_result = cursor.fetchone()
        
        if not category_result:
            print("❌ Delay category not found!")
            return
            
        category_id = category_result[0]
        print(f"✅ Found Delay category (ID: {category_id})")
        
        # Updated Hindi template for Delay
        hindi_template = "कृपया ध्यान दें! ट्रेन संख्या {train_number} {train_name} {start_station} से {end_station} देर से चल रही है। हमें असुविधा के लिए खेद है।"
        
        # Check if Hindi template exists
        cursor.execute(
            "SELECT id FROM announcement_templates WHERE category_id = ? AND language_code = 'hi'",
            (category_id,)
        )
        existing_template = cursor.fetchone()
        
        if existing_template:
            # Update existing template
            cursor.execute(
                "UPDATE announcement_templates SET template_text = ? WHERE id = ?",
                (hindi_template, existing_template[0])
            )
            print("   ✅ Updated Hindi template")
        else:
            # Insert new template
            cursor.execute(
                "INSERT INTO announcement_templates (category_id, language_code, template_text) VALUES (?, 'hi', ?)",
                (category_id, hindi_template)
            )
            print("   ✅ Created Hindi template")
        
        conn.commit()
        
        print("\n" + "=" * 50)
        print("✅ Hindi Template Update Complete!")
        
        # Show updated Hindi template
        print("\n📋 Updated Hindi Template:")
        cursor.execute("""
            SELECT template_text 
            FROM announcement_templates 
            WHERE category_id = ? AND language_code = 'hi'
        """, (category_id,))
        
        template = cursor.fetchone()
        if template:
            print(f"   Hindi: {template[0]}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {str(e)}")
    finally:
        conn.close()
    
    print("\n" + "=" * 50)
    print("✅ Hindi Template Update Completed!")

if __name__ == "__main__":
    update_delay_hindi() 