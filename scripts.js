$(document).ready(function () {
    let anexoCount = 0;
    const anexos = {};
    const produtos = [];

    // Função para incluir um anexo
    $('#incluir-anexo').on('click', function () {
        const fileInput = $('<input type="file" class="d-none" accept="application/pdf, image/*">');
        $('body').append(fileInput);
        fileInput.trigger('click');

        fileInput.on('change', function () {
            if (this.files.length === 0) {
                fileInput.remove();
                return;
            }

            const file = this.files[0];
            const fileId = ++anexoCount;
            const reader = new FileReader();

            reader.onload = function (e) {
                anexos[fileId] = {
                    nomeArquivo: file.name,
                    blobArquivo: e.target.result.split(',')[1]
                };
                $('#anexos-container').append(`
                    <div class="anexo-item mb-2" data-id="${fileId}">
                        <button type="button" class="btn btn-info visualizar-anexo"><i class="fa-solid fa-eye"></i></button>
                        <button type="button" class="btn btn-danger remover-anexo"><i class="fa-solid fa-trash"></i></button>
                        <span>${file.name}</span>
                    </div>
                `);
            };

            reader.readAsDataURL(file);
            fileInput.remove();
        });
    });

    // Função para remover um anexo
    $(document).on('click', '.remover-anexo', function () {
        const anexoItem = $(this).closest('.anexo-item');
        const fileId = anexoItem.data('id');
        delete anexos[fileId];
        anexoItem.remove();
    });

    // Função para visualizar um anexo
    $(document).on('click', '.visualizar-anexo', function () {
        const fileId = $(this).closest('.anexo-item').data('id');
        const fileData = anexos[fileId];
        if (fileData) {
            const link = document.createElement('a');
            link.href = `data:application/octet-stream;base64,${fileData.blobArquivo}`;
            link.download = fileData.nomeArquivo;
            link.click();
        }
    });

    // Função para adicionar um novo produto
    $('#adicionar-produto').on('click', function () {
        const produtosContainer = $('#produtos-container');
        const numProdutos = produtosContainer.find('.produto-item').length + 1;

        const produtoHTML = `
            <div class="produto-item mb-4" id="produto${numProdutos}">
                <div class="form-row">
                    <h5 class="mr-4">Produto - ${numProdutos}</h5>
                    <button type="button" class="btn btn-danger remover-produto"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-12">
                        <label for="produto${numProdutos}">Produto</label>
                        <input type="text" class="form-control" id="produto${numProdutos}" name="produto${numProdutos}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-3">
                        <label for="undMedida${numProdutos}">UND. Medida</label>
                        <select class="form-control" id="undMedida${numProdutos}" name="undMedida${numProdutos}" required>
                            <option value="unidade">Unidade</option>
                            <option value="kg">Kg</option>
                            <option value="dg">DG</option>
                            <option value="cg">CG</option>
                            <option value="mg">MG</option>
                            <option value="g">G</option>
                            <option value="lb">LB</option>
                            <option value="t">T</option>
                        </select>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="qtdEstoque${numProdutos}">QTDE. em Estoque</label>
                        <input type="number" class="form-control" id="qtdEstoque${numProdutos}" name="qtdEstoque${numProdutos}" required>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="valorUnitario${numProdutos}">Valor Unitário</label>
                        <input type="number" step="0.01" class="form-control" id="valorUnitario${numProdutos}" name="valorUnitario${numProdutos}" required>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="valorTotal${numProdutos}">Valor Total</label>
                        <input type="text" class="form-control" id="valorTotal${numProdutos}" name="valorTotal${numProdutos}" disabled>
                    </div>
                </div>
            </div>
        `;

        $('#adicionar-produto').before(produtoHTML);
    });

    // Função para remover um produto
    $(document).on('click', '.remover-produto', function () {
        $(this).closest('.produto-item').remove();
    });

    // Calcula o valor total com base no valor unitário e quantidade em estoque
    $(document).on('input', 'input[name^="qtdEstoque"], input[name^="valorUnitario"]', function () {
        const index = $(this).attr('id').match(/\d+/)[0];
        const qtdEstoque = $(`#qtdEstoque${index}`).val() || 0;
        const valorUnitario = $(`#valorUnitario${index}`).val() || 0;
        const valorTotal = (qtdEstoque * valorUnitario).toFixed(2);
        $(`#valorTotal${index}`).val(valorTotal);
    });

    // Função para preencher o endereço automaticamente com base no CEP
    $('#cep').on('blur', function () {
        const cep = $(this).val().replace(/\D/g, '');
        if (cep.length === 8) {
            $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function (data) {
                if (!data.erro) {
                    $('#endereco').val(data.logradouro);
                    $('#bairro').val(data.bairro);
                    $('#municipio').val(data.localidade);
                    $('#estado').val(data.uf);
                }
            });
        }
    });

    // Função para validar os produtos
    function validarProdutos() {
        let produtosValidos = false;
        $('.produto-item').each(function () {
            let produtoValido = true;
            $(this).find('input, select').each(function () {
                if ($(this).prop('required') && !$(this).val()) {
                    produtoValido = false;
                }
            });
            if (produtoValido) {
                produtosValidos = true;
            }
        });
        return produtosValidos;
    }

    // Validação ao enviar o formulário
    $('#cadastro-form').on('submit', function (e) {
        if (!validarProdutos()) {
            alert('Por favor, adicione pelo menos um produto e preencha todos os campos obrigatórios dos produtos.');
            e.preventDefault();
        } else {
            e.preventDefault();
            $('#loading-modal').modal('show');

            const formData = $(this).serializeArray();
            const jsonData = {};

            formData.forEach(item => {
                jsonData[item.name] = item.value;
            });

            jsonData.produtos = [];
            jsonData.anexos = Object.values(anexos);

            // Cria o arquivo JSON
            const jsonString = JSON.stringify(jsonData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dados_formulario.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    });
});
