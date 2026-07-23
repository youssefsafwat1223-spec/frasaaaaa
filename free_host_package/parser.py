import json
import re
import os
import sys

def parse_traits(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by "السمة" header
    pattern = re.compile(r'[🔴🔵]\s*السمة\s*:?\s*(\d+)\s*:?\s*(.+)')
    
    parts = pattern.split(content)
    
    traits = []
    
    for i in range(1, len(parts), 3):
        trait_id = parts[i].strip()
        trait_name = parts[i+1].strip()
        body = parts[i+2]
        
        # Robust symbol extraction
        symbol_match = re.search(r'([^\n]*الرمز[^\n]*)', body)
        symbol = ""
        if symbol_match:
            symbol_line = symbol_match.group(1)
            symbol = re.sub(r'الرمز|:', '', symbol_line).strip()
        
        root_match = re.search(r'الجذر\s*ال.*?نف.*?يس\s*:\s*(.*?)(?=\n🧠|\n🔵|\n$)', body, re.DOTALL)
        root = root_match.group(1).replace('\n', ' ').strip() if root_match else ""
        root = re.sub(r'\s+', ' ', root)
        
        face_match = re.search(r'(?:الظهور.*?الوجه|المؤ\s*رس?ر\s*الوج\s*يه)\s*:\s*(.*?)(?=\n🔵|$)', body, re.DOTALL)
        face_indicators = []
        if face_match:
            face_text = face_match.group(1)
            bullets = re.findall(r'[•●]\s*(.+)', face_text)
            face_indicators = [b.strip() for b in bullets]
            
        refinement_match = re.search(r'الته(?:ذي|ذ يُ|ذُي|ذ ي)ب\s*:\s*(.*)', body, re.DOTALL)
        refinement = refinement_match.group(1).replace('\n', ' ').strip() if refinement_match else ""
        refinement = re.sub(r'\s+', ' ', refinement)
        
        traits.append({
            "id": f"sabti_{trait_id.zfill(3)}",
            "name": trait_name,
            "symbol": symbol,
            "psychological_root": root,
            "facial_indicators": face_indicators,
            "refinement": refinement
        })
        
    return traits

def update_json(traits, json_path):
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = {}
        
    if "sabti_traits" not in data:
        data["sabti_traits"] = []
        
    existing_ids = {t["id"] for t in data["sabti_traits"]}
    
    for t in traits:
        if t["id"] in existing_ids:
            for i, existing in enumerate(data["sabti_traits"]):
                if existing["id"] == t["id"]:
                    data["sabti_traits"][i] = t
                    break
        else:
            data["sabti_traits"].append(t)
            
    data["sabti_traits"].sort(key=lambda x: x["id"])
            
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'batch1.txt'
    traits = parse_traits(input_file)
    print(f"Extracted {len(traits)} traits from {input_file}.")
    update_json(traits, 'firasa_master_dataset.json')
    print("JSON updated successfully.")
