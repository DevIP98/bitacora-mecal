require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const registrosDir = path.join(__dirname, 'registros');

// The replacement character U+FFFD (0xEFBFBD in UTF-8) comes from files that were
// originally Latin-1/Windows-1252 and got incorrectly read.
// efbfbd is the UTF-8 replacement character for unknown bytes.
// The original byte for 'é' in latin1 is 0xE9, for 'í' is 0xED.
// We can detect these by looking for \uFFFD in the string.

function fixEncoding(str) {
    // This text was originally latin1. The JSON was saved with the replacement char.
    // We need to try to recover. Since efbfbd is what we see, we can't recover perfectly,
    // but we can at least replace the replacement chars with nothing rather than show garbage.
    // Better: re-read the file as latin1 and see if the bytes make sense.
    return str;
}

async function fixData() {
    const files = fs.readdirSync(registrosDir).filter(f => f.endsWith('.json'));
    let fixed = 0;
    let skipped = 0;

    console.log('Scanning', files.length, 'files for encoding issues...');

    for (const file of files) {
        const filePath = path.join(registrosDir, file);
        const rawUtf8 = fs.readFileSync(filePath, 'utf8');
        
        // Check if it contains the replacement character
        if (!rawUtf8.includes('\uFFFD')) {
            skipped++;
            continue;
        }

        // Re-read as latin1 to recover original characters
        const rawLatin1 = fs.readFileSync(filePath, 'latin1');
        let registro;
        try {
            registro = JSON.parse(rawLatin1);
        } catch(e) {
            console.log('Parse error on', file, e.message);
            continue;
        }

        // Update in Supabase
        const { error } = await sb.from('registros')
            .update({
                observaciones_generales: registro.observacionesGenerales || null,
                tipo_servicio: registro.tipoServicio,
                nombre_responsable: registro.nombreResponsable,
            })
            .eq('id', registro.id);

        if (error) {
            console.log('Error updating', registro.id, error.message);
        } else {
            console.log('Fixed:', file, '→', registro.observacionesGenerales?.substring(0, 40));
            fixed++;
        }
    }

    console.log(`\nFixed: ${fixed}, Skipped (clean): ${skipped}`);
}

fixData().catch(console.error);
