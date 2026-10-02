:: Autorise le client à consommer plus de 4Go de RAM (Equivalent à 4gb_patch.exe)
binary_pattern_replace.exe Wow.exe "E0 00 03 01" "E0 00 23 01"
binary_pattern_replace.exe Wow.exe "00 96 26" "00 A1 26"
