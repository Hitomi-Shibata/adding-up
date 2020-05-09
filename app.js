'use strict';
//Node.js に用意されたモジュールを呼び出しています。
//fs は、FileSystem（ファイルシステム）の略で、ファイルを扱うためのモジュールです。
//readline は、ファイルを一行ずつ読み込むためのモジュールです。
const fs = require('fs');
const readline = require('readline');

//popu-pref.csv ファイルから、ファイルを読み込みを行う Stream（ストリーム）を生成し、
// さらにそれを readline オブジェクトの input として設定し、 rl オブジェクトを作成しています。
//Node.js では、入出力が発生する処理をほとんど Stream という形で扱います。
//Node.js で Stream を扱う際は、 Stream に対してイベントを監視し、 
//イベントが発生した時に呼び出される関数を設定することによって、情報を利用します。
const rs = fs.createReadStream('./popu-pref.csv');
const rl = readline.createInterface({ 'input': rs, 'output': {} });

//集計されたデータを格納する連想配列です。
const prefectureDataMap = new Map(); // key: 都道府県 value: 集計データのオブジェクト

//rl オブジェクトで line というイベントが発生したら この無名関数を呼んでください、という意味です。
rl.on('line', (lineString) => {
    //引数 lineString で与えられた文字列をカンマ , で分割して、それを columns という名前の配列にしています。
    //今回扱うファイルは各行が 集計年,都道府県名,10〜14歳の人口,15〜19歳の人口 という形式になっているので、
    //これをカンマ , で分割すると ["集計年","都道府県名","10〜14歳の人口","15〜19歳の人口"] といった配列になります。
    const columns = lineString.split(',');

    //columns の要素へ並び順の番号でアクセスして、集計年（0 番目）、都道府県（1 番目）、15〜19 歳の人口（3 番目）、をそれぞれ変数に保存しています。
    //人口の部分だけ parseInt() （パースイント）という関数が使われています。これは文字列を整数値に変換する関数です。
    const year = parseInt(columns[0]);
    const prefecture = columns[1];
    const popu = parseInt(columns[3]);

    //集計年の数値 year が、 2010 または 2015 である時を if 文で判定しています。
    if(year === 2010 || year === 2015){

        //連想配列 prefectureDataMap からデータを取得しています。
        let value = prefectureDataMap.get(prefecture);

        //value の値が Falsy の場合に、value に初期値となるオブジェクトを代入します。
        //その県のデータを処理するのが初めてであれば、value の値は undefined になるので、この条件を満たし、value に値が代入されます。
        if(!value){
            value = {
                popu10: 0, //2010 年の人口
                popu15: 0, //2015 年の人口
                change: null //人口の変化率 初期値では null を代入しておきます。
            };
        }

        //人口のデータを連想配列に保存しています。
        //連想配列へ格納したので、次から同じ県のデータが来ればlet value = prefectureDataMap.get(prefecture);のところでは、
        //保存したオブジェクトが取得されることになります。
        if(year === 2010){
            value.popu10 = popu; 
        }
        if(year === 2015){
            value.popu15 = popu; 
        }
        prefectureDataMap.set(prefecture, value);
        
    }
});

//'close' イベントは、全ての行を読み込み終わった際に呼び出されます。
//変化率の計算は、その県のデータが揃 そろったあとでしか正しく行えないので、 以下のように close イベントの中へ実装
rl.on('close', () => {

    //Map に for-of を使うと、キーと値で要素が 2 つある配列が前に与えられた変数に代入されます。
    //let [変数名1, 変数名2] のように変数と一緒に配列を宣言することで、
    //第一要素の key という変数にキーを、第二要素の value という変数に値を代入することができます。(分割代入)
    for(let [key, value] of prefectureDataMap){

        //集計データのオブジェクト value の change プロパティに、変化率を代入するコードです。
        value.change = value.popu15 / value.popu10;
    }
    //Array.from(prefectureDataMap) の部分で、連想配列を普通の配列に変換する処理をおこなっています。
    //sort に対して渡すこの関数は比較関数と言い、これによって並び替えをするルールを決めることができます。
    const rankingArray = Array.from(prefectureDataMap).sort((pair1, pair2) => {

        //変化率の降順に並び替えを行いたいので、 pair2 が pair1 より大きかった場合、pair2 を pair1 より前にする必要があります。
        //つまり、pair2 が pair1 より大きいときに正の整数を返すような処理を書けば良いので、 
        //ここではpair2 の変化率のプロパティから pair1 の変化率のプロパティを引き算した値を返しています。
        return pair2[1].change - pair1[1].change;
    });
    const rankingStrings = rankingArray.map(([key, value]) => {
        return key + ': ' + value.popu10 + '=>' + value.popu15 + ' 変化率:' + value.change;
    });
    console.log(rankingStrings);
});