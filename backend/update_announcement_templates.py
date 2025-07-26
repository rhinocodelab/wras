#!/usr/bin/env python3
"""
Script to update announcement templates with multilingual versions
"""

import sqlite3
import json

def update_announcement_templates():
    """Update announcement templates with multilingual versions"""
    print("🚀 Updating Announcement Templates with Multilingual Versions...")
    print("=" * 60)
    
    # Connect to database
    db_path = "wras_dhh.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Multilingual templates data
        templates_data = {
            'arriving': {
                'en': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is arriving at platform number {platform}",
                'hi': "कृपया ध्यान दें! ट्रेन संख्या {train_number} {train_name} {start_station} से {end_station} के लिए प्लेटफ़ॉर्म संख्या {platform} पर आ रही है",
                'mr': "कृपया लक्ष द्या! ट्रेन क्रमांक {train_number} {train_name} {start_station} ते {end_station} प्लॅटफॉर्म क्रमांक {platform} वर येत आहे",
                'gu': "કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર {train_number} {train_name} {start_station}થી {end_station} માટે પ્લેટફોર્મ નંબર {platform} પર આવી રહી છે"
            },
            'delay': {
                'en': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} is running late. We apologize for the inconvenience.",
                'hi': "कृपया ध्यान दें! ट्रेन संख्या {train_number} {train_name} {start_station} से {end_station} के लिए चल रही है। हमें हुई असुविधा के लिए खेद है।",
                'mr': "कृपया लक्ष द्या! ट्रेन क्रमांक {train_number} {train_name} {start_station} ते {end_station} उशिरा आहे. झालेल्या गैरसोयीबद्दल आम्ही क्षमस्व आहोत",
                'gu': "કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર {train_number} {train_name} {start_station}થી {end_station} માટે મોડે ચાલી રહી છે. અગળ થયેલી અસુવિધા માટે ક્ષમા કરશો"
            },
            'cancelled': {
                'en': "Attention Please! Train number {train_number} {train_name} from {start_station} to {end_station} scheduled for today has been cancelled. We apologize for the inconvenience",
                'hi': "कृपया ध्यान दें! आज की ट्रेन संख्या {train_number} {train_name} {start_station} से {end_station} के लिए रद्द कर दी गई है. हमें हुई असुविधा के लिए खेद है।",
                'mr': "कृपया लक्ष द्या! आजची ट्रेन क्रमांक {train_number} {train_name} {start_station} ते {end_station} रद्द करण्यात आली आहे. झालेल्या गैरसोयीबद्दल आम्ही क्षमस्व आहोत",
                'gu': "કૃપા કરીને ધ્યાન આપો! આજની ટ્રેન નંબર {train_number} {train_name} {start_station}થી {end_station} માટે રદ કરી દેવામાં આવી છે. અગળ થયેલી અસુવિધા માટે ક્ષમા કરશો"
            },
            'platform_change': {
                'en': "Attention Please! The platform for train number {train_number} {train_name} from {start_station} to {end_station} has been changed to platform number {platform}.",
                'hi': "कृपया ध्यान दें! ट्रेन संख्या {train_number} {train_name} {start_station} से {end_station} के लिए प्लेटफ़ॉर्म बदलकर प्लेटफ़ॉर्म संख्या {platform} कर दिया गया है",
                'mr': "कृपया लक्ष द्या! ट्रेन क्रमांक {train_number} {train_name} {start_station} ते {end_station} चा प्लॅटफॉर्म बदलून प्लॅटफॉर्म क्रमांक {platform} करण्यात आला आहे",
                'gu': "કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર {train_number} {train_name} {start_station}થી {end_station} માટે પ્લેટફોર્મ નંબર બદલીને {platform} કરી દેવામાં આવી છે"
            }
        }
        
        templates_updated = 0
        templates_created = 0
        
        for category_code, languages in templates_data.items():
            print(f"\n📝 Processing category: {category_code}")
            
            # Get category ID
            cursor.execute("SELECT id FROM announcement_categories WHERE category_code = ?", (category_code,))
            category_result = cursor.fetchone()
            
            if not category_result:
                print(f"❌ Category '{category_code}' not found!")
                continue
                
            category_id = category_result[0]
            
            for language_code, template_text in languages.items():
                # Check if template already exists
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
                    templates_created += 1
                    print(f"   ✅ Created {language_code} template")
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Templates Update Complete!")
        print(f"   Templates updated: {templates_updated}")
        print(f"   Templates created: {templates_created}")
        print(f"   Total templates: {templates_updated + templates_created}")
        
        # Show summary of all templates
        print("\n📋 Current Templates Summary:")
        cursor.execute("""
            SELECT ac.category_code, at.language_code, at.template_text 
            FROM announcement_templates at 
            JOIN announcement_categories ac ON at.category_id = ac.id 
            ORDER BY ac.id, at.language_code
        """)
        
        templates = cursor.fetchall()
        for template in templates:
            category_code, language_code, template_text = template
            print(f"   {category_code} ({language_code}): {template_text[:50]}...")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {str(e)}")
    finally:
        conn.close()
    
    print("\n" + "=" * 60)
    print("✅ Announcement Templates Update Completed!")

if __name__ == "__main__":
    update_announcement_templates() 