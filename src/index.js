import fs from 'fs';
import ic from 'iconv-lite';
import Jimp from 'jimp';

const dir = './image/';

const lina = p =>
  Math.atan2((p[1].y - p[0].y), (p[1].x - p[0].x)) * (180 / Math.PI);

const conv = (file, xy) => new Promise((res) => {
  // 加工
  Jimp
    .read(`${dir}${file.name}.${file.type}`)
    .then((img) => {
      console.log(`${file.name} is processing...`);
      // 中点
      const cent = {
        x: (xy[0].x + xy[1].x) / 2,
        y: (xy[0].y + xy[1].y) / 2,
      };
      // 画像を貼り付け用に複製
      const clone = img.clone();
      // トリミング幅計算用
      const trimh = img
        .clone()
        .rotate(90 - lina(xy))
        .bitmap.height;

      const width = () => {
        if (cent.x * 2 < clone.bitmap.width) {
          return (clone.bitmap.width - cent.x) * 2;
        }
        return cent.x * 2;
      };

      // 白紙に貼り付けて加工
      const paper = new Jimp(width(), cent.y * 2, 0x00000000)
      // 画質調整
        .quality(100)
      // 複製画像を貼り付ける
        .blit(
          clone,
          (cent.x * 2) > clone.bitmap.width ?
            0 :
            width() - clone.bitmap.width,
          0,
        )
      // 画質保持のため倍にする
        .scale(2)
      // 回転
        .rotate(90 - lina(xy))
      // 補完モードで元のサイズに戻す
        .scale(0.5, Jimp.RESIZE_BICUBIC);

      paper
      // トリミング
        .crop(0, 0, paper.bitmap.width, trimh)
      // 書き出し
        .write(`${dir}output/${file.name}_.${file.type}`);
      // console.log(trimh);

      // console.log('中点:', cent);
      console.log(`${file.name} is done!`);
      res(true);
    });
});

fs.readFile(`${dir}data.txt`, (e, d) => {
  const orig = ic.decode(d, 'Shift_JIS');
  orig.split('\n')
    .reduce((p, c) => [...p, c.split('\t')], [])
    .reduce((p, c) => {
      const c0 = c[0].split('.');
      const fn = { name: c0[0], type: c0[1] };
      return [...p, {
        fn,
        xy: [{
          x: Number(c[1]), y: Number(c[2]),
        }, {
          x: Number(c[3]), y: Number(c[4]),
        }],
      },
      ];
    }, [])
    .forEach((v, i) => {
      if (i >= 0) {
        Promise
          .resolve()
          .then(() => {
            conv(v.fn, v.xy);
          });
      }
    });
  // console.log(data[0]);
});
