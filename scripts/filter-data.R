# --- Configuration des entrées ---
input_csv <- "scripts/gog_games_dataset.csv"              # Chemin du fichier CSV d'entrée
output_csv <- "scripts/gog_games_dataset_v2.csv"            # Chemin du fichier CSV de sortie
cols_to_keep <- c("id", "title", "genres", "dateGlobal", "category",
                  "salesVisibility", "isFree", "currency", "amount",
                  "baseAmount", "overallAvgRating")       # Liste des colonnes à conserver


data <- read.csv(input_csv, stringsAsFactors = FALSE)


cols_found <- intersect(cols_to_keep, colnames(data))
cols_missing <- setdiff(cols_to_keep, colnames(data))

if (length(cols_missing) > 0) {
  warning(paste("Col didn't found in the CSV :", paste(colonnes_manquantes, collapse = ", ")))
}


data_filtre <- data[, cols_found, drop = FALSE]

write.csv(data_filtre, output_csv, row.names = FALSE)

cat("New CSV exported :", output_csv, "\n")
