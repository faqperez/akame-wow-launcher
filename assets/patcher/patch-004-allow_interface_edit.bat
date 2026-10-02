:: Autorise l'édition de fichier d'interface
binary_pattern_replace.exe Wow.exe "00 A1 26" "00 16 4E"
binary_pattern_replace.exe Wow.exe "04 85 C0 74 39 56" "04 85 C0 EB 39 56"
binary_pattern_replace.exe Wow.exe "C0 FF 85 C0 75 05 5E 8B" "C0 FF 85 C0 EB 05 5E 8B"
binary_pattern_replace.exe Wow.exe "B6 C0 FF B8 01 00 00 00" "B6 C0 FF B8 03 00 00 00"
binary_pattern_replace.exe Wow.exe "C0 FF 5F B8 01 00 00 00" "C0 FF 5F B8 03 00 00 00"
binary_pattern_replace.exe Wow.exe "B8 01 00 00 00 7F 12 83 C8 FF F7" "B8 01 00 00 00 EB 12 83 C8 FF F7"
binary_pattern_replace.exe Wow.exe "C0 5F 83 C0 03 5E 8B E5 5D C3 CC" "C0 5F B8 03 00 00 00 EB ED C3 CC"
