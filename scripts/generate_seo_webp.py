import os
import sys

# Intenta importar Pillow, si no está, informa al usuario
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("\nError: La librería 'Pillow' no está instalada.")
    print("Por favor, ejecuta primero: pip install Pillow\n")
    sys.exit(1)

def create_gradient_webp(filename, color_top, color_bottom, width=960, height=540, quality=72):
    """
    Genera una imagen WebP con un gradiente vertical simple.
    """
    # Crear una nueva imagen RGB
    base = Image.new('RGB', (width, height), color_top)
    top = Image.new('RGB', (width, height), color_top)
    bottom = Image.new('RGB', (width, height), color_bottom)
    
    # Crear la máscara para el gradiente
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        # Calcular la opacidad (0 a 255) basada en la posición vertical
        opacity = int(255 * (y / height))
        mask_data.extend([opacity] * width)
    mask.putdata(mask_data)
    
    # Combinar las imágenes usando la máscara
    gradient = Image.composite(bottom, top, mask)
    
    # Asegurar que el directorio de salida existe
    # Lo guardaremos en 'temp_assets' en la raíz del proyecto
    output_dir = "temp_assets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    filepath = os.path.join(output_dir, filename)
    
    # Guardar como WebP
    try:
        gradient.save(filepath, 'WEBP', quality=quality)
        print(f"✅ Imagen generada: {filepath}")
    except Exception as e:
        print(f"❌ Error guardando {filename}: {e}")

# --- LISTA DE IMÁGENES A GENERAR (12 archivos) ---
# (Nombre, Color Superior, Color Inferior)
images_to_generate = [
    # Salud General / Ensayos
    ("knee-osteoarthritis-clinical-trial-houston.webp", "#001F3F", "#38BDF8"),
    ("clinical-trial-patient-hispanic.webp", "#F1F5F9", "#001F3F"),
    ("std-testing-confidential-clinic-houston.webp", "#38BDF8", "#F1F5F9"),

    # Salud Femenina / Ginecología
    ("pap-smear-screening-women-clinic.webp", "#A855F7", "#F1F5F9"),
    ("vaginal-yeast-infection-care-houston.webp", "#F472B6", "#FFFFFF"),
    ("abnormal-vaginal-discharge-education-houston.webp", "#F472B6", "#F1F5F9"),
    ("womens-intimate-health-hub-houston.webp", "#A855F7", "#38BDF8"),
    ("gynecologic-consultation-women-houston.webp", "#38BDF8", "#FFFFFF"),
    ("vaginal-infection-orientation-houston.webp", "#F1F5F9", "#F472B6"),
    ("intimate-wellbeing-trust-houston.webp", "#FFFFFF", "#A855F7"),
    ("candidiasis-education-womens-health-houston.webp", "#F472B6", "#A855F7"),
    ("womens-health-orientation-spanish-houston.webp", "#38BDF8", "#F472B6"),
]

# --- EJECUCIÓN ---
if __name__ == "__main__":
    print("\n--- Iniciando generación de assets WebP SEO para VITALIS ---\n")
    print(f"Guardando imágenes en: temp_assets/\n")
    for filename, color_top, color_bottom in images_to_generate:
        create_gradient_webp(filename, color_top, color_bottom)

    print("\n✅ Generación completada.")
    print("Mueve estos archivos de 'temp_assets/' a la carpeta de imágenes que Cursor está utilizando.")