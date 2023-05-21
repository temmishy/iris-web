/**
 * Generates a CRC table for calculating CRC32 checksums.
 * 
 * @returns {Array} The generated CRC table.
 */
var makeCRCTable = function(){
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

/**
 * Calculates the CRC32 checksum for the given string.
 * 
 * @param {string} str - The string to calculate the CRC32 checksum for.
 * @returns {number} The calculated CRC32 checksum.
 */
export function crc32(str) {
    // Get the CRC table or generate a new one if it doesn't exist
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ (-1);

    // Calculate the CRC32 checksum for the string
    for (var i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
}