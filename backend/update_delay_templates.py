#!/usr/bin/env python3
"""
Script to update Delay category templates with corrected versions
"""

import sqlite3

def update_delay_templates():
    """Update Delay category templates with corrected versions"""
    print("🚀 Updating Delay Category Templates...")
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
        
        # Updated Delay templates
        delay_templates = {
            'en': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is running late. We apologize for the inconvenience.",
            'hi': "कृपया ध्यान दें! ट्रेन संख्या {train_number} {train_name} {start_station} से {end_station} के लिए चल रही है। हमें हुई असुविधा के लिए खेद है।",
            'mr': "कृपया लक्ष द्या! ट्रेन क्रमांक {train_number} {train_name} {start_station} ते {end_station} उशिरा आहे. झालेल्या गैरसोयीबद्दल आम्ही क्षमस्व आहोत.",
            'gu': "કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર {train_number} {train_name} {start_station}થી {end_station} માટે મોડે ચાલી રહી છે. અગળ થયેલી અસુવિધા માટે ક્ષમા કરશો."
        }
        
        templates_updated = 0
        
        for language_code, template_text in delay_templates.items():
            # Check if template exists
            cursor.execute(
                "SELECT id FROM announcement_templates WHERE category_id = ? AND language_code = ?",
                (category_id, language_code)
            )
            existing_template = cursor.fetchone()
            
            if existing_template:
                # Update existing template
                cursor.execute(
                    "UPDATE announcement_templates SET template_text = ? WHERE id = ?",
                    (template_text, existing_template[0])
                )
                templates_updated += 1
                print(f"   ✅ Updated {language_code} template")
            else:
                # Insert new template
                cursor.execute(
                    "INSERT INTO announcement_templates (category_id, language_code, template_text) VALUES (?, ?, ?)",
                    (category_id, language_code, template_text)
                )
                templates_updated += 1
                print(f"   ✅ Created {language_code} template")
        
        conn.commit()
        
        print("\n" + "=" * 50)
        print(f"✅ Delay Templates Update Complete!")
        print(f"   Templates updated: {templates_updated}")
        
        # Show updated Delay templates
        print("\n📋 Updated Delay Templates:")
        cursor.execute("""
            SELECT language_code, template_text 
            FROM announcement_templates 
            WHERE category_id = ? 
            ORDER BY language_code
        """, (category_id,))
        
        templates = cursor.fetchall()
        for template in templates:
            language_code, template_text = template
            print(f"   {language_code}: {template_text[:80]}...")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {str(e)}")
    finally:
        conn.close()
    
    print("\n" + "=" * 50)
    print("✅ Delay Templates Update Completed!")

if __name__ == "__main__":
    update_delay_templates() 