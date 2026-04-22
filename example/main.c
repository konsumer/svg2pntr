// cc example/main.c -I../pntr -lm -o tiger

#define PNTR_IMPLEMENTATION
#include "pntr.h"
#include "tiger.h"

int main(void) {
    pntr_image* image = pntr_gen_image_color(900, 900, PNTR_WHITE);
    draw_tiger(image);
    pntr_save_image(image, "tiger.png");
    pntr_unload_image(image);
    return 0;
}
